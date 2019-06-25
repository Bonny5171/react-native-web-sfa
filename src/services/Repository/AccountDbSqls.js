const cmds = [
  // vw_account
  {
    name: 'vw_account',
    down: 'DROP VIEW IF EXISTS vw_account;',
    up:
      `
  CREATE VIEW vw_account AS
    SELECT
      a.id,
      a.sf_id,
      a.sf_parent_id,
      a.sf_record_type_id,
      COALESCE(a.sf_name, '') AS sf_name,
      COALESCE(a.sf_nome_fantasia__c, '') AS sf_nome_fantasia__c,
      COALESCE(a.sf_codigo_totvs__c, '') AS sf_codigo_totvs__c,
      COALESCE(a.sf_phone, '') AS sf_phone,
      COALESCE(a.sf_photo_url, '') AS sf_photo_url,
      '[404]' AS sf_sector__c,
      COALESCE(a.sf_telefone_adicional__c, '') AS sf_telefone_adicional__c,
      COALESCE(a.sf_legal_number__c, '') AS sf_legal_number__c,
      COALESCE(a.sf_situacao__c, 'NULO') AS sf_situacao__c,
      COALESCE(a.sf_photo1__c, '') AS sf_photo1__c,
      COALESCE(a.sf_person_email, '') AS sf_person_email,
      COALESCE(a.sf_rua_cobranca__c, '') AS sf_rua_cobranca__c,
      COALESCE(a.sf_estado_cobranca__c, '') AS sf_estado_cobranca__c,
      COALESCE(a.sf_cepcobranca__c, '') AS sf_cepcobranca__c,
      COALESCE(a.sf_rua__c, '') AS sf_rua__c,
      COALESCE(a.sf_estado__c, '') AS sf_estado__c,
      COALESCE(a.sf_cep__c, '') AS sf_cep__c,
      COALESCE(a.sf_cidade_texto__c, '') AS sf_cidade_texto__c,
      COALESCE(a.sf_rua_entrega__c, '') AS sf_rua_entrega__c,
      COALESCE(a.sf_estado_entrega__c, '') AS sf_estado_entrega__c,
      COALESCE(a.sf_cepentrega__c, '') AS sf_cepentrega__c,
      COALESCE(a.sf_cidade_entrega_texto__c, '') AS sf_cidade_entrega_texto__c,
      COALESCE(a.sf_cidade_cobranca_texto__c, '') AS sf_cidade_cobranca_texto__c,
      COALESCE(a.sf_type, '') AS sf_type,
      COALESCE(a.sf_frequencia__c, 'NULO') AS sf_frequencia__c,
      COALESCE(a.sf_pontualidade__c, 'NULO') AS sf_pontualidade__c,
      COALESCE(a.sf_confirmacao__c, 'NULO') AS sf_confirmacao__c,
      COALESCE(a.sf_encartes__c, 'NULO') AS sf_encartes__c,
      COALESCE(a.sf_centralizador_cobranca__c, '') AS sf_centralizador_cobranca__c,
      COALESCE(a.sf_centralizador_pagamentos__c, '') AS sf_centralizador_pagamentos__c,
      COALESCE(a.sf_setor_atividade_div1__c, 'NULO') AS sf_setor_atividade_div1__c,
      COALESCE(a.sf_setor_atividade_dve__c, 'NULO') AS sf_setor_atividade_dve__c,
      COALESCE(a.sf_ordem_compra_div1__c, '') AS sf_ordem_compra_div1__c,
      COALESCE(a.sf_ordem_compra_dve__c, '') AS sf_ordem_compra_dve__c,
      COALESCE(a.sf_saldo_duplicatas_vencidas__c, '0') AS sf_saldo_duplicatas_vencidas__c,
      COALESCE(a.sf_saldo_despesas_vencidas__c, '0') AS sf_saldo_despesas_vencidas__c,
      COALESCE(a.sf_saldo_despesas_avencer__c, '0') AS sf_saldo_despesas_avencer__c,
      COALESCE(a.sf_pedidos_aprovar__c, '0') AS sf_pedidos_aprovar__c,
      COALESCE(a.sf_saldo_limite__c, '0') AS sf_saldo_limite__c,
      COALESCE(a.sf_limite_adicional__c, '0') AS sf_limite_adicional__c,
      COALESCE(a.sf_motivo_bloqueio__c, 'NULO') AS sf_motivo_bloqueio__c,
      COALESCE(b.sf_developer_name, '') AS sf_developer_name
    FROM 
      sf_account a
    --INNER JOIN
    --(
    --  SELECT DISTINCT 
    --    s.sf_id AS sf_id,
    --    s.is_deleted AS is_deleted
    --  FROM 
    --    sf_share s
    --  WHERE 
    --    s.sf_object_name = 'Account' AND 
    --    s.user_id = (SELECT value FROM parameter WHERE id = 'CURRENT_USER_ID' AND is_active = 'true' AND is_deleted = 'false') AND 
    --    s.is_deleted = 'false' AND
    --    s.is_active = 'true'
    --) s ON (s.sf_id = a.sf_id) 
    INNER JOIN
      sf_record_type b ON (a.sf_record_type_id = b.sf_id)
    WHERE 
      a.is_deleted = 'false' AND
      a.is_active = 'true'
    ;      
    `
  }
];

export { cmds };