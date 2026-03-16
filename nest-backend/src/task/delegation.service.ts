import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { v4 as uuidv4 } from 'uuid';
import { hashToken, generateToken, clean } from '../common/utils/helpers';
import * as QRCode from 'qrcode';

const MAX_EXPIRY_HOURS = 2160;
const DEFAULT_EXPIRY_HOURS = 24;

@Injectable()
export class DelegationService {
  private readonly logger = new Logger(DelegationService.name);

  constructor(private readonly db: DatabaseService) {}

  async delegateTask(token: string, data: any, baseUrl: string) {
    const tokenHash = hashToken(token);
    const newAssigneeName = clean(data.new_assignee_name);
    const newAssigneePhone = clean(data.new_assignee_phone);
    const newAssigneeEmail = clean(data.new_assignee_email);
    const delegateHours = Math.min(
      parseInt(data.expires_in_hours) || DEFAULT_EXPIRY_HOURS,
      MAX_EXPIRY_HOURS,
    );

    if (!newAssigneeName) {
      throw new Error('new_assignee_name is required');
    }

    const linkResult = await this.db.query(
      `
      SELECT tl.*, t.max_delegation_depth
      FROM task_links tl
      JOIN tasks t ON t.id = tl.task_id
      WHERE tl.token_hash = $1
    `,
      [tokenHash],
    );

    const link = linkResult.rows[0];
    if (!link) {
      throw new Error('Link not found');
    }

    if (new Date(link.expires_at) < new Date()) {
      throw new Error('Link expired');
    }

    if (link.status !== 'ACTIVE') {
      throw new Error('Link is no longer active');
    }

    if (link.admin_locked) {
      throw new Error('Link is disabled by admin');
    }

    if (link.delegation_depth >= link.max_delegation_depth) {
      throw new Error('Max delegation depth reached');
    }

    const newToken = generateToken();
    const newTokenHash = hashToken(newToken);
    const newLinkId = uuidv4();
    const otpVerified = newAssigneeEmail ? 0 : 1;
    const expiresAt = new Date(
      Date.now() + delegateHours * 60 * 60 * 1000,
    ).toISOString();
    const magicLink = `${baseUrl}/#/task/${newToken}`;

    await this.db.transaction(async (client) => {
      await client.query(
        `
        UPDATE task_links SET status = 'DELEGATED' WHERE id = $1
      `,
        [link.id],
      );

      await client.query(
        `
        INSERT INTO task_links (
          id, task_id, parent_link_id, token_hash, magic_link, 
          delegation_depth, assigned_to_name, assigned_to_phone, 
          assigned_to_email, expires_at, otp_verified
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
        [
          newLinkId,
          link.task_id,
          link.id,
          newTokenHash,
          magicLink,
          link.delegation_depth + 1,
          newAssigneeName,
          newAssigneePhone,
          newAssigneeEmail,
          expiresAt,
          otpVerified,
        ],
      );
    });

    let qrDataUrl: string | null = null;
    try {
      qrDataUrl = await QRCode.toDataURL(magicLink, { width: 300, margin: 2 });
    } catch (err) {
      this.logger.warn('Failed to generate QR code', err);
    }

    return {
      magic_link: magicLink,
      qr_code_data: qrDataUrl,
      expires_at: expiresAt,
      delegation_depth: link.delegation_depth + 1,
    };
  }
}
