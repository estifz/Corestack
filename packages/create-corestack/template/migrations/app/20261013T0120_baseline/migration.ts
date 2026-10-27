#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/3c67a2d84215f5ec7893a5d3ab83abf2ef7f72c401242a8f5a0ddb77252cfad0/contract'
import endContract from '../../snapshots/3c67a2d84215f5ec7893a5d3ab83abf2ef7f72c401242a8f5a0ddb77252cfad0/contract.json' with { type: 'json' }
import {
    Migration,
    MigrationCLI,
    checkExpression,
    col,
    fn,
    lit,
    primaryKey,
} from '@prisma/orm-postgres/migration'

export default class M extends Migration<never, End> {
    override readonly endContractJson = endContract

    override get operations() {
        return [
            this.createSchema({ schema: 'auth' }),
            this.createSchema({ schema: 'public' }),
            this.createTable({
                schema: 'auth',
                table: 'email_verification_tokens',
                columns: [
                    col('consumedAt', 'timestamptz(3)', {
                        codecRef: {
                            codecId: 'pg/timestamptz-temporal@1',
                            typeParams: { precision: 3 },
                        },
                    }),
                    col('createdAt', 'timestamptz(3)', {
                        notNull: true,
                        default: fn('now()'),
                        codecRef: {
                            codecId: 'pg/timestamptz-temporal@1',
                            typeParams: { precision: 3 },
                        },
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
                    col('tokenHash', 'text', {
                        notNull: true,
                        codecRef: { codecId: 'pg/text@1' },
                    }),
                    col('userId', 'text', {
                        notNull: true,
                        codecRef: { codecId: 'pg/text@1' },
                    }),
                ],
                constraints: [primaryKey(['id'])],
            }),
            this.createTable({
                schema: 'auth',
                table: 'password_reset_tokens',
                columns: [
                    col('consumedAt', 'timestamptz(3)', {
                        codecRef: {
                            codecId: 'pg/timestamptz-temporal@1',
                            typeParams: { precision: 3 },
                        },
                    }),
                    col('createdAt', 'timestamptz(3)', {
                        notNull: true,
                        default: fn('now()'),
                        codecRef: {
                            codecId: 'pg/timestamptz-temporal@1',
                            typeParams: { precision: 3 },
                        },
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
                    col('tokenHash', 'text', {
                        notNull: true,
                        codecRef: { codecId: 'pg/text@1' },
                    }),
                    col('userId', 'text', {
                        notNull: true,
                        codecRef: { codecId: 'pg/text@1' },
                    }),
                ],
                constraints: [primaryKey(['id'])],
            }),
            this.createTable({
                schema: 'auth',
                table: 'refresh_tokens',
                columns: [
                    col('consumedAt', 'timestamptz(3)', {
                        codecRef: {
                            codecId: 'pg/timestamptz-temporal@1',
                            typeParams: { precision: 3 },
                        },
                    }),
                    col('createdAt', 'timestamptz(3)', {
                        notNull: true,
                        default: fn('now()'),
                        codecRef: {
                            codecId: 'pg/timestamptz-temporal@1',
                            typeParams: { precision: 3 },
                        },
                    }),
                    col('expiresAt', 'timestamptz(3)', {
                        notNull: true,
                        codecRef: {
                            codecId: 'pg/timestamptz-temporal@1',
                            typeParams: { precision: 3 },
                        },
                    }),
                    col('familyId', 'text', {
                        notNull: true,
                        codecRef: { codecId: 'pg/text@1' },
                    }),
                    col('id', 'text', {
                        notNull: true,
                        codecRef: { codecId: 'pg/text@1' },
                    }),
                    col('revokedAt', 'timestamptz(3)', {
                        codecRef: {
                            codecId: 'pg/timestamptz-temporal@1',
                            typeParams: { precision: 3 },
                        },
                    }),
                    col('tokenHash', 'text', {
                        notNull: true,
                        codecRef: { codecId: 'pg/text@1' },
                    }),
                    col('userId', 'text', {
                        notNull: true,
                        codecRef: { codecId: 'pg/text@1' },
                    }),
                ],
                constraints: [primaryKey(['id'])],
            }),
            this.createTable({
                schema: 'auth',
                table: 'users',
                columns: [
                    col('createdAt', 'timestamptz(3)', {
                        notNull: true,
                        default: fn('now()'),
                        codecRef: {
                            codecId: 'pg/timestamptz-temporal@1',
                            typeParams: { precision: 3 },
                        },
                    }),
                    col('email', 'text', {
                        notNull: true,
                        codecRef: { codecId: 'pg/text@1' },
                    }),
                    col('emailVerifiedAt', 'timestamptz(3)', {
                        codecRef: {
                            codecId: 'pg/timestamptz-temporal@1',
                            typeParams: { precision: 3 },
                        },
                    }),
                    col('id', 'text', {
                        notNull: true,
                        codecRef: { codecId: 'pg/text@1' },
                    }),
                    col('isActive', 'bool', {
                        notNull: true,
                        default: lit(true),
                        codecRef: { codecId: 'pg/bool@1' },
                    }),
                    col('passwordHash', 'text', {
                        notNull: true,
                        codecRef: { codecId: 'pg/text@1' },
                    }),
                    col('role', 'text', {
                        notNull: true,
                        default: lit('USER'),
                        codecRef: { codecId: 'pg/text@1' },
                    }),
                    col('updatedAt', 'timestamptz', {
                        notNull: true,
                        codecRef: { codecId: 'pg/timestamptz-temporal@1' },
                    }),
                ],
                constraints: [
                    primaryKey(['id']),
                    checkExpression(
                        'users_role_check_1954e8c0',
                        "\"role\" IN ('USER', 'ADMIN')",
                    ),
                ],
            }),
            this.addUnique({
                schema: 'auth',
                table: 'email_verification_tokens',
                constraint: 'email_verification_tokens_tokenHash_key',
                columns: ['tokenHash'],
            }),
            this.addUnique({
                schema: 'auth',
                table: 'password_reset_tokens',
                constraint: 'password_reset_tokens_tokenHash_key',
                columns: ['tokenHash'],
            }),
            this.addUnique({
                schema: 'auth',
                table: 'refresh_tokens',
                constraint: 'refresh_tokens_tokenHash_key',
                columns: ['tokenHash'],
            }),
            this.addUnique({
                schema: 'auth',
                table: 'users',
                constraint: 'users_email_key',
                columns: ['email'],
            }),
            this.createIndex({
                schema: 'auth',
                table: 'email_verification_tokens',
                index: 'email_verification_tokens_expiresAt_idx_6b6b8c10',
                columns: ['expiresAt'],
            }),
            this.createIndex({
                schema: 'auth',
                table: 'email_verification_tokens',
                index: 'email_verification_tokens_userId_idx_a489d58a',
                columns: ['userId'],
            }),
            this.createIndex({
                schema: 'auth',
                table: 'password_reset_tokens',
                index: 'password_reset_tokens_expiresAt_idx_6b6b8c10',
                columns: ['expiresAt'],
            }),
            this.createIndex({
                schema: 'auth',
                table: 'password_reset_tokens',
                index: 'password_reset_tokens_userId_idx_a489d58a',
                columns: ['userId'],
            }),
            this.createIndex({
                schema: 'auth',
                table: 'refresh_tokens',
                index: 'refresh_tokens_expiresAt_idx_6b6b8c10',
                columns: ['expiresAt'],
            }),
            this.createIndex({
                schema: 'auth',
                table: 'refresh_tokens',
                index: 'refresh_tokens_familyId_idx_3d03045e',
                columns: ['familyId'],
            }),
            this.createIndex({
                schema: 'auth',
                table: 'refresh_tokens',
                index: 'refresh_tokens_userId_idx_a489d58a',
                columns: ['userId'],
            }),
            this.addForeignKey({
                schema: 'auth',
                table: 'email_verification_tokens',
                foreignKey: {
                    name: 'email_verification_tokens_userId_fkey',
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
                table: 'password_reset_tokens',
                foreignKey: {
                    name: 'password_reset_tokens_userId_fkey',
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
                    name: 'refresh_tokens_userId_fkey',
                    columns: ['userId'],
                    references: {
                        schema: 'auth',
                        table: 'users',
                        columns: ['id'],
                    },
                    onDelete: 'cascade',
                },
            }),
        ]
    }
}

MigrationCLI.run(import.meta.url, M)
