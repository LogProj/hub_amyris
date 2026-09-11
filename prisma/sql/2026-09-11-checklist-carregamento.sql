-- Checklist de Carregamento (hub_amyris) — db_inhaus, schema public.
-- SÓ CRIA: não modifica nem remove nada que já exista. Pode rodar mais de uma vez.
begin;

create table if not exists public.dm_amyris_epi (
  codigo text primary key,
  nome   text not null,
  ordem  integer not null,
  ativo  boolean not null default true
);

insert into public.dm_amyris_epi (codigo, nome, ordem) values
  ('luva', 'Luva', 1),
  ('bota', 'Bota', 2),
  ('capacete', 'Capacete', 3),
  ('oculos', 'Óculos', 4),
  ('auricular', 'Protetor auricular', 5),
  ('cinto', 'Cinto', 6),
  ('talabarte', 'Talabarte', 7)
on conflict (codigo) do nothing;

create table if not exists public.ft_amyris_checklist_carregamento (
  id                 serial primary key,
  criado_por_id      integer,
  criado_por_email   text not null,
  criado_por_nome    text,
  inicio_em          timestamptz not null,
  fim_em             timestamptz not null,
  veiculo_numero     text not null,
  veiculo_capacidade text not null,
  lacres             text[] not null default '{}',
  supervisor_cpf     text not null,
  supervisor_nome    text not null,
  supervisor_funcao  text not null,
  lider_cpf          text not null,
  lider_nome         text not null,
  lider_funcao       text not null,
  ocorrencia         text,
  enviado_em         timestamptz not null default now()
);

create index if not exists ft_amyris_checklist_carregamento_enviado_em_idx
  on public.ft_amyris_checklist_carregamento (enviado_em desc);

create table if not exists public.ft_amyris_checklist_carregamento_operador (
  id           serial primary key,
  checklist_id integer not null references public.ft_amyris_checklist_carregamento (id) on delete cascade,
  cpf          text not null,
  nome         text not null,
  funcao       text,
  unique (checklist_id, cpf)
);

create table if not exists public.ft_amyris_checklist_carregamento_epi (
  id           serial primary key,
  checklist_id integer not null references public.ft_amyris_checklist_carregamento (id) on delete cascade,
  epi_codigo   text not null references public.dm_amyris_epi (codigo),
  status       text not null check (status in ('sim', 'na', 'nao')),
  unique (checklist_id, epi_codigo)
);

commit;
