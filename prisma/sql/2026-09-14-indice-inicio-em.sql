-- Checklist de Carregamento (hub_amyris) — db_inhaus, schema public.
-- SÓ CRIA: adiciona o índice em inicio_em, que é a coluna usada pelas consultas
-- do histórico (ordenação, filtro por mês e lista de meses). Pode rodar mais de uma vez.
begin;

create index if not exists ft_amyris_checklist_carregamento_inicio_em_idx
  on public.ft_amyris_checklist_carregamento (inicio_em desc);

commit;
