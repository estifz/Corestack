#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/3c67a2d84215f5ec7893a5d3ab83abf2ef7f72c401242a8f5a0ddb77252cfad0/contract'
import startContract from '../../snapshots/3c67a2d84215f5ec7893a5d3ab83abf2ef7f72c401242a8f5a0ddb77252cfad0/contract.json' with { type: 'json' }
import type { Contract as End } from '../../snapshots/91aaab5834c11dc65f7c651f0daf622fc755b43fce8c4226440f76e9d8319a34/contract'
import endContract from '../../snapshots/91aaab5834c11dc65f7c651f0daf622fc755b43fce8c4226440f76e9d8319a34/contract.json' with { type: 'json' }
import {
    Migration,
    MigrationCLI,
    col,
    fn,
    primaryKey,
} from '@prisma/orm-postgres/migration'

export default class M extends Migration<Start, End> {
    override readonly startContractJson = startContract
    override readonly endContractJson = endContract

    override get operations() {
        return [
            this.dropConstraint({
                schema: 'auth',
                table: 'refresh_tokens',
                constraint: 'refresh_tokens_userId_fkey',
                kind: 'foreignKey',
            }),
            this.dropIndex({
                schema: 'auth',
                table: 'refresh_tokens',
                index: 'refresh_tokens_familyId_idx_3d03045e',
            }),
            this.dropColumn({
                schema: 'auth',
                table: 'refresh_tokens',
                column: 'familyId',
            }),
            this.dropIndex({
                schema: 'auth',
                table: 'refresh_tokens',
                index: 'refresh_tokens_userId_idx_a489d58a',
            }),
            this.dropColumn({
                schema: 'auth',
                table: 'refresh_tokens',
                column: 'userId',
            }),
            this.createTable({
                schema: 'auth',
                table: 'sessions',
                columns: [
                    col('createdAt', 'timestamptz(3)', {
                        notNull: true,
                        default: fn('now()'),
                        codecRef: {
                            codecId: 'pg/timestamptz-temporal@1',
                            typeParams: { precision: 3 },
                        },
                    }),
                    col('deviceName', 'text', {
                        codecRef: { codecId: 'pg/text@1' },
                    }),
                    col('expiresAt', 'timestamptz(3)', {
                        notNull: true,
                        codecRef: {
                            codecId: 'pg/timestamptz-temporal@1',
                            typeParams: { precision: 3 },
                        },
                    }),
                    col('id', 'text', {
                        notNull: true,
                        codecRef: { codecId: 'pg/text@1' },
                    }),
                    col('ipAddress', 'text', {
                        codecRef: { codecId: 'pg/text@1' },
                    }),
                    col('lastSeenAt', 'timestamptz(3)', {
                        codecRef: {
                            codecId: 'pg/timestamptz-temporal@1',
                            typeParams: { precision: 3 },
                        },
                    }),
                    col('revokedAt', 'timestamptz(3)', {
                        codecRef: {
                            codecId: 'pg/timestamptz-temporal@1',
                            typeParams: { precision: 3 },
                        },
                    }),
                    col('userAgent', 'text', {
                        codecRef: { codecId: 'pg/text@1' },
                    }),
                    col('userId', 'text', {
                        notNull: true,
                        codecRef: { codecId: 'pg/text@1' },
                    }),
                ],
                constraints: [primaryKey(['id'])],
            }),
            this.addColumn({
                schema: 'auth',
                table: 'refresh_tokens',
                column: col('sessionId', 'text', {
                    codecRef: { codecId: 'pg/text@1' },
                }),
            }),
            this.setNotNull({
                schema: 'auth',
                table: 'refresh_tokens',
                column: 'sessionId',
            }),
            this.createIndex({
                schema: 'auth',
                table: 'refresh_tokens',
                index: 'refresh_tokens_sessionId_idx_29f415d4',
                columns: ['sessionId'],
            }),
            this.createIndex({
                schema: 'auth',
                table: 'sessions',
                index: 'sessions_expiresAt_idx_6b6b8c10',
                columns: ['expiresAt'],
            }),
            this.createIndex({
                schema: 'auth',
                table: 'sessions',
                index: 'sessions_userId_idx_a489d58a',
                columns: ['userId'],
            }),
            this.addForeignKey({
                schema: 'auth',
                table: 'sessions',
                foreignKey: {
                    name: 'sessions_userId_fkey',
                    columns: ['userId'],
                    references: {
                        schema: 'auth',
                        table: 'users',
                        columns: ['id'],
                    },
                    onDelete: 'cascade',
                },
            }),
            this.addForeignKey({
                schema: 'auth',
                table: 'refresh_tokens',
                foreignKey: {
                    name: 'refresh_tokens_sessionId_fkey',
                    columns: ['sessionId'],
                    references: {
                        schema: 'auth',
                        table: 'sessions',
                        columns: ['id'],
                    },
                    onDelete: 'cascade',
                },
            }),
        ]
    }
}

MigrationCLI.run(import.meta.url, M)
