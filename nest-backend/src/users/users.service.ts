import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly db: DatabaseService) {}

  async getAllUsers() {
    const sql = `
      SELECT u.id, u.username, u."FirstName", u."LastName", u."PersonID_Onec", 
             u.phone, u.email, u.affiliation, u.status, u.permissions, u.created_at,
             array_agg(r.name) FILTER (WHERE r.name IS NOT NULL) as roles,
             array_agg(r.label) FILTER (WHERE r.label IS NOT NULL) as labels
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
    const result = await this.db.query(sql);
    return result.rows;
  }

  async createUser(data: any) {
    try {
      return await this.db.transaction(async (client) => {
        const userRes = await client.query(
          `
          INSERT INTO users (username, password, "FirstName", "LastName", "PersonID_Onec", phone, email, affiliation, status, permissions)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `,
          [
            data.username,
            data.password || '123456', // Assuming password hashing happens elsewhere or is handled by default
            data.FirstName,
            data.LastName,
            data.PersonID_Onec,
            data.phone,
            data.email,
            data.affiliation,
            data.status || 'ACTIVE',
            JSON.stringify(data.permissions || []),
          ],
        );

        const userId = userRes.rows[0].id;

        if (data.roles && Array.isArray(data.roles)) {
          for (const roleName of data.roles) {
            const roleRes = await client.query(
              'SELECT id FROM roles WHERE name = $1',
              [roleName],
            );
            if (roleRes.rows[0]) {
              await client.query(
                'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
                [userId, roleRes.rows[0].id],
              );
            }
          }
        }
        return { success: true, userId };
      });
    } catch (err) {
      this.logger.error(`createUser error: ${err.message}`);
      throw err;
    }
  }

  async updateUser(id: number, data: any) {
    try {
      return await this.db.transaction(async (client) => {
        // Construct the SET clause dynamically for optional password update
        const setClauses = [
          `username = $1`,
          `"FirstName" = $2`,
          `"LastName" = $3`,
          `"PersonID_Onec" = $4`,
          `phone = $5`,
          `email = $6`,
          `affiliation = $7`,
          `status = $8`,
          `permissions = $9`,
        ];
        const queryParams = [
          data.username,
          data.FirstName,
          data.LastName,
          data.PersonID_Onec,
          data.phone,
          data.email,
          data.affiliation,
          data.status,
          JSON.stringify(data.permissions || []),
        ];
        let paramIndex = queryParams.length + 1;

        if (data.password) {
          // Assuming password hashing happens elsewhere or is handled by default
          setClauses.push(`password = $${paramIndex++}`);
          queryParams.push(data.password);
        }

        queryParams.push(id); // Add id for WHERE clause

        await client.query(
          `
          UPDATE users
          SET ${setClauses.join(', ')}
          WHERE id = $${paramIndex}
        `,
          queryParams,
        );

        if (data.roles && Array.isArray(data.roles)) {
          await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
          for (const roleName of data.roles) {
            const roleRes = await client.query(
              'SELECT id FROM roles WHERE name = $1',
              [roleName],
            );
            if (roleRes.rows[0]) {
              await client.query(
                'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
                [id, roleRes.rows[0].id],
              );
            }
          }
        }
        return { success: true };
      });
    } catch (err) {
      this.logger.error(`updateUser error: ${err.message}`);
      throw err;
    }
  }

  async deleteUser(id: number) {
    try {
      return await this.db.transaction(async (client) => {
        this.logger.log(`Attempting to delete user with ID: ${id}`);
        // Explicitly delete user roles first to be safe, even though we have ON DELETE CASCADE
        await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
        const result = await client.query('DELETE FROM users WHERE id = $1', [
          id,
        ]);

        if (result.rowCount === 0) {
          throw new Error('ไม่พบข้อมูลผู้ใช้งานที่ต้องการลบ');
        }

        this.logger.log(`Delete user result: ${result.rowCount} rows deleted`);
        return { success: true, rowCount: result.rowCount };
      });
    } catch (err) {
      this.logger.error(`deleteUser error: ${err.message}`);
      throw err;
    }
  }

  async getRoles() {
    const res = await this.db.query('SELECT * FROM roles');
    return res.rows;
  }

  async validateUser(username: string, password: string) {
    const sql = `
      SELECT u.id, u.username, u."FirstName", u."LastName", u.email, u.affiliation, 
             u.status, u.permissions,
             array_agg(r.name) FILTER (WHERE r.name IS NOT NULL) as roles,
             array_agg(r.label) FILTER (WHERE r.label IS NOT NULL) as labels
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.username = $1 AND u.password = $2
      GROUP BY u.id
    `;
    const result = await this.db.query(sql, [username, password]);
    return result.rows[0] || null;
  }
}
