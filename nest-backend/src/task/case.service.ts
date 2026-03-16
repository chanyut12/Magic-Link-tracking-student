import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { clean } from '../common/utils/helpers';

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
    return 'IN_PROGRESS';
  }

  async reviewCase(caseId: number, body: Record<string, unknown>) {
    const reviewAction = this.normalizeAction(body.review_action);
    const reviewNote = clean(String(body.review_note || '')) || null;
    const reviewedBy = clean(String(body.reviewed_by || '')) || 'ผอ.';
    const nextStatus = this.getCaseStatusByAction(reviewAction);
    const reviewId = uuidv4();

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
