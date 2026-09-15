console.error(
  "Bloqueado: o DATABASE_URL aponta para o db_inhaus COMPARTILHADO. `prisma db push` apagaria " +
    "tabelas de outros sistemas. Crie tabelas com um .sql só-criação e rode: node scripts/aplicar-sql.mjs <arquivo>",
)
process.exit(1)
