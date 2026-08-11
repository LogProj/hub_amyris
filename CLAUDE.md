# Instruções do projeto — hub_amyris

## Tooltip "info" dos dashboards (OBRIGATÓRIO manter atualizado)

Cada dashboard tem, ao lado do título, um campo **info** (ícone/tooltip) que explica ao
usuário o que aquele painel mostra e como os números são calculados (ver o padrão já
existente no dashboard de **Absenteísmo** — componente de regras/info).

**Regra:** SEMPRE que houver qualquer alteração em um indicador — nova métrica, mudança
na lógica de cálculo, fonte de dados, filtros (ex.: corte D-1), fórmula (ex.: turnover),
período considerado, exclusões (ex.: categorias removidas) — o texto do **info** daquele
dashboard DEVE ser atualizado na mesma tarefa, para o usuário continuar entendendo o
painel. Não deixar o info desatualizado em relação ao código.

**Como escrever o info:**
- Linguagem **clara e simples** — traduzir análise complexa para o dia a dia da operação.
- **Visual e escaneável**: frases curtas, tópicos/bullets, destaque do que importa.
- **Com exemplo numérico** sempre que ajudar (ex.: "Se no mês houve 2 desligamentos e o
  quadro médio foi 20 pessoas, o turnover é 2 ÷ 20 × 100 = 10%").
- Explicar o recorte em termos de negócio (ex.: "considera os dados até ontem",
  "mostra quantas pessoas estavam trabalhando naquele dia").
- **Foco 100% no INDICADOR e no NEGÓCIO.** O público é a operação/gestão, NÃO
  desenvolvedores — nunca citar tabelas, views, colunas, nomes de campos, SQL,
  RPA, banco de dados ou qualquer termo técnico/de programação. Fale de pessoas,
  presenças, faltas, admissões, desligamentos, quadro — não de como o dado é
  armazenado ou processado.
