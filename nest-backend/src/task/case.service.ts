import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { clean } from '../common/utils/helpers';
import * as crypto from 'crypto';

type ReviewAction = 'ASSIST' | 'FORWARD' | 'CLOSE';

@Injectable()
export class CaseService {
  private readonly logger = new Logger(CaseService.name);

  constructor(private readonly db: DatabaseService) {}

  private normalizeAction(action: unknown): ReviewAction {
    const normalized = String(action || '')
      .trim()
      .toUpperCase();
    if (normalized === 'ASSIST') return 'ASSIST';
    if (normalized === 'FORWARD') return 'FORWARD';
    if (normalized === 'CLOSE') return 'CLOSE';
    throw new Error(
      'review_action must be one of: ASSIST, FORWARD, CLOSE',
    );
  }

  private getCaseStatusByAction(action: ReviewAction): string {
    if (action === 'CLOSE') return 'RESOLVED';
    if (action === 'FORWARD') return 'AWAITING_HELP';
    return 'IN_PROGRESS'; // ASSIST — วนกลับเข้ากระบวนการติดตามใหม่
  }

  async reviewCase(caseId: number, body: Record<string, unknown>) {
    const reviewAction = this.normalizeAction(body.review_action);
    const reviewNote = clean(String(body.review_note || '')) || null;
    const reviewedBy = clean(String(body.reviewed_by || '')) || 'ผอ.';
    const nextStatus = this.getCaseStatusByAction(reviewAction);
    const reviewId = crypto.randomUUID();

    try {
      const caseResult = await this.db.query(
        `SELECT id FROM cases WHERE id = $1 LIMIT 1`,
        [caseId],
      );
      if (!caseResult.rows[0]) {
        throw new Error('Case not found');
      }

      await this.db.transaction(async (client) => {
        await client.query(
          `
          INSERT INTO case_reviews (id, case_id, review_action, review_note, reviewed_by)
          VALUES ($1, $2, $3, $4, $5)
        `,
          [reviewId, caseId, reviewAction, reviewNote, reviewedBy],
        );

        await client.query(`UPDATE cases SET status = $1 WHERE id = $2`, [
          nextStatus,
          caseId,
        ]);
      });

      const reviewResult = await this.db.query(
        `
        SELECT *
        FROM case_reviews
        WHERE id = $1
        LIMIT 1
      `,
        [reviewId],
      );

      return {
        success: true,
        case_id: caseId,
        case_status: nextStatus,
        review: reviewResult.rows[0] || null,
      };
    } catch (err) {
      this.logger.error(`reviewCase error: ${err.message}`);
      throw err;
    }
  }

  async getTasksByCase(caseId: number) {
    try {
      const caseResult = await this.db.query(
        `SELECT id FROM cases WHERE id = $1 LIMIT 1`,
        [caseId],
      );
      if (!caseResult.rows[0]) {
        throw new Error('Case not found');
      }

      const result = await this.db.query(
        `
        SELECT
          t.id AS task_id,
          t.created_at,
          tl.assigned_to_name AS initial_assignee,
          (SELECT COUNT(*) FROM task_links WHERE task_id = t.id) AS link_count,
          EXISTS(
            SELECT 1 FROM task_links tl2
            JOIN task_submissions ts ON ts.task_link_id = tl2.id
            WHERE tl2.task_id = t.id
          ) AS has_submission
        FROM tasks t
        LEFT JOIN task_links tl ON tl.task_id = t.id AND tl.delegation_depth = 0
        WHERE t.case_id = $1
        ORDER BY t.created_at ASC
        `,
        [caseId],
      );

      return { success: true, data: result.rows };
    } catch (err) {
      this.logger.error(`getTasksByCase error: ${err.message}`);
      throw err;
    }
  }

  async getCaseReviews(caseId: number) {
    try {
      const caseResult = await this.db.query(
        `SELECT id FROM cases WHERE id = $1 LIMIT 1`,
        [caseId],
      );
      if (!caseResult.rows[0]) {
        throw new Error('Case not found');
      }

      const reviewsResult = await this.db.query(
        `
        SELECT *
        FROM case_reviews
        WHERE case_id = $1
        ORDER BY reviewed_at DESC
      `,
        [caseId],
      );

      return { success: true, data: reviewsResult.rows };
    } catch (err) {
      this.logger.error(`getCaseReviews error: ${err.message}`);
      throw err;
    }
  }
}
