import { Platform, AsyncStorage } from 'react-native';
import { repository, queryBuilder as query } from '../Repository/AccountDb';
import { getUserId, getLocalStorage } from '../Auth';
import { queryGetClients } from '../Pages/Common/Queries';
import { common } from '../Pages/Common';

class Account {
  static async saveParameter(name, value) {
    const repo = await repository();
    return repo.param.set(name, value);
  }

  static async getById(id) {
    if (!this.appName) this.appName = await getLocalStorage('appDevName');
    const repo = await repository();
    const select = (await common.queryGetClients(this.appName)).where('a.id = ?', id);
    // console.log('select.toString', select.toString());
    const account = await repo.queryOne(select);
    // console.log('account', account);
    const objAccount = mapToClients([account], true);
    // console.log('objAccount', objAccount);
    return objAccount;
  }

  static async get(cb, orderBy, isDesc = true) {
    console.log('>>> 11');
    if (!this.appName) this.appName = await getLocalStorage('appDevName');
    console.log('>>> 22', this.appName);
    const repo = await repository();

    const SELECT = query.select()
      .field('a.id', 'id')
      .field('a.sf_id', 'sf_id')
      .field('a.sf_name', 'sf_name')
      .field('a.sf_nome_fantasia__c', 'sf_nome_fantasia__c')
      .field('a.sf_codigo_totvs__c', 'sf_codigo_totvs__c')
      .field('a.sf_situacao__c', 'sf_situacao__c')
      .field(`a.sf_setor_atividade_${this.appName.toLowerCase()}__c`, 'sf_sector')
      .field(`COALESCE(a.sf_ordem_compra_${this.appName.toLowerCase()}__c, '')`, 'sf_ordem_compra__c')
      .field('a.sf_sector__c', 'sf_sector__c')
      .field('a.sf_photo1__c', 'sf_photo1__c')
      .field('a.sf_legal_number__c', 'sf_legal_number__c')
      .field('e.sf_tipo_embalamento__c', 'sf_tipo_embalamento__c')
      .field('e.sf_classificador_tipo_embalamento__c', 'sf_classificador_tipo_embalamento__c')
      .from('vw_account', 'a')
      .left_join('sf_embalamento_cliente__c', 'e', 'a.sf_id = e.sf_id')
      .order('a.sf_name');
    if (!orderBy) {
      SELECT.order('sf_name');
    } else {
      orderBy.forEach(field => {
        SELECT.order(field, isDesc);
      });
      // console.log('orderBy', orderBy);
    }


    const rows = await repo.query(SELECT);
    const data = mapToClients(rows._array);
    // console.log('data', data);
    cb(data);
  }

  static async filter(param, cb, shouldFilter, filters) {
    if (!this.appName) this.appName = await getLocalStorage('appDevName');
    let SELECT = await queryGetClients(this.appName);

    // Filtros
    const {
      name, situation, /* positivacao, sector, , */
    } = param;

    if (name) {
      SELECT = SELECT.where(
        query.expr().and('a.sf_name LIKE ?', `%${name}%`).or('a.sf_codigo_totvs__c LIKE ?', `%${name}%`)
      );
    }
    // console.log('FILTER QUERY', SELECT.toString());

    if (situation) {
      SELECT = SELECT
      .where('a.sf_situacao__c = ?', `${situation}`);
    }
    // Comentado pela necessidade de fazer um JOIN e precisar apelidar essa query
    // if (shouldFilter) {
    //   filters.forEach(({ condition, value }) => { SELECT = SELECT.where(condition, value); });
    // }
    /* RETIRAR COMENTÁRIO QUANDO DESMOCAR DADOS
    const { a, de } = positivacao;
    if (a) {
      console.log('Filtro de positivação "a", ainda não implementado, não existe colunas para filtro na tabela.');
      SELECT = SELECT.where(`sf_positivation > ${a}`);
    }

    if (de) {
      console.log('Filtro de positivação "de", ainda não implementado, não existe colunas para filtro na tabela.');
      SELECT = SELECT.where(`sf_positivation < ${de}`);
    }

    if (sector) {
      console.log('Filtro de sector, ainda não implementado, não existe colunas para filtro na tabela.');
      SELECT = SELECT.where('sf_sector LIKE ?', `%${sector}%`);
    }

    if (situation) {
      console.log('Filtro de situation, ainda não implementado, não existe colunas para filtro na tabela.');
      SELECT = SELECT.where('sf_situation LIKE ?', `%${situation}%`);
    } */

    const repo = await repository();
    const rows = await repo.query(SELECT);

    const data = mapToClients(rows._array);

    cb(data);
  }

  static async getNavigation(id) {
    // console.log('SEARCHED Id', id);
    const repo = await repository();
    const account = await repo.queryOne(
      query.select()
        .from('vw_account')
        .field('id')
        .field('sf_name')
        .where('id = ?', id)
    );
    // console.log('getOneById -- account', account);
    return account;
  }

  static async customQuery(query, queryOne, shouldNotMap) {
    const repo = await repository();
    let result = null;
    let resultMapped = null;
    if (shouldNotMap) {
      result = await repo.query(query);
      return result._array;
    }

    if (queryOne) {
      result = await repo.queryOne(query);
      resultMapped = mapToClients([result], true);
    } else {
      result = await repo.query(query);
      resultMapped = mapToClients(result._array);
    }
    // console.log('result before map', result);
    // console.log('query', query);
    return resultMapped;
  }

  static async getDiscount(account) {
    const repo = await repository();

    const discount = await repo.query(query
      .select()
      .field('sf_name')
      .field('sf_desconto__c')
      .field('sf_prazo__c')
      .from('sf_politica_comercial__c')
      .where(`sf_conta__c = '${account}'`)
      .order('sf_name'));

    return discount._array;
  }

  static async getFinancialInformation(sf_conta__c) {
    const repo = await repository();
    const SELECT = query.select()
      .field('b.sf_tipo__c', 'sf_tipo__c')
      .field('b.sf_status__c', 'sf_status__c')
      .field('b.sf_id', 'sf_id')
      .field('b.sf_credit_approved__c', 'sf_credit_approved__c')
      .field('b.sf_credit_limit__c', 'sf_credit_limit__c')
      .from('sf_analise_credito_conta__c', 'a')
      .join('sf_credit_analysis__c', 'b', 'a.sf_analise_credito__c = b.sf_id')
      .where('b.is_deleted = ?', 'false')
      .where('a.sf_ativo__c = ?', 'true')
      .where('a.sf_conta__c = ?', sf_conta__c);

    const informacoesFinanceira = await repo.query(SELECT);
    return informacoesFinanceira._array;
  }
}

export default Account;


const mapToClients = (array, one) => {
  const clients = array.map((item) => {
    return {
      key: item.id,
      sf_id: item.sf_id,
      fantasyName: item.sf_name.toUpperCase(),
      name: item.sf_nome_fantasia__c,
      // fim
      sf_photo_url: item.sf_photo_url,
      sf_photo1__c: item.sf_photo1__c,
      reason: item.sf_name,
      email: item.sf_person_email,
      phone: item.sf_phone,
      billing: {
        type: 'ENDEREÇO DE COBRANÇA',
        address: item.sf_rua_entrega__c,
        postalCode: item.sf_cepentrega__c,
        city: item.sf_cidade_cobranca_texto__c,
        state: item.sf_estado_cobranca__c,
      },
      comercial: {
        type: 'ENDEREÇO COMERCIAL',
        address: item.sf_rua__c,
        postalCode: item.sf_cep__c,
        city: item.sf_cidade_texto__c,
        state: item.sf_estado__c,
      },
      shipping: {
        type: 'ENDEREÇO DE ENTREGA',
        address: item.sf_rua_entrega__c,
        postalCode: item.sf_cepentrega__c,
        city: item.sf_cidade_entrega_texto__c,
        state: item.sf_estado_entrega__c,
      },
      distributionCenter: {
        type: 'CENTRO DE DISTRIBUIÇÃO',
        address: 'Rua Franciso Sá, 427',
        postalCode: '88765532-1',
        city: 'Ouricuri',
        state: 'PE',
      },
      cnpj: item.sf_legal_number__c,
      phone2: item.sf_telefone_adicional__c,
      contact: item.sf_name,
      client: item.sf_name,
      code: `${item.sf_codigo_totvs__c}`,
      situation: item.sf_situacao__c,
      sector: item.sf_sector,
      stores: [],
      status: item.sf_situacao__c,
      type: item.sf_developer_name,
      parentId: item.sf_parent_id,
      totalBranches: item.total_branches,
      blockReason: item.sf_motivo_bloqueio__c,
      frequencia: item.sf_frequencia__c,
      pontualidade: item.sf_pontualidade__c,
      confirmacao: item.sf_confirmacao__c,
      encartes: item.sf_encartes__c,
      centralizadorCobranca: item.sf_centralizador_cobranca__c,
      centralizadorPagamentos: item.sf_centralizador_pagamentos__c,
      ordemCompra: JSON.parse(item.sf_ordem_compra__c),
      saldoDuplicatasVencidas: item.sf_saldo_duplicatas_vencidas__c,
      saldoDespesasVencidas: item.sf_saldo_despesas_vencidas__c,
      saldoDespesasAvencer: item.sf_saldo_despesas_avencer__c,
      pedidosAprovar: item.sf_pedidos_aprovar__c,
      saldoLimite: item.sf_saldo_limite__c,
      limiteAdicional: item.sf_limite_adicional__c,
      motivoBloqueio: item.sf_motivo_bloqueio__c,
      situacao: item.sf_situacao__c,
      despesasVencidas: item.sf_saldo_despesas_vencidas__c,
      tipoEmbalamento: {
        id: item.sf_tipo_embalamento__c,
        type: item.sf_classificador_tipo_embalamento__c,
      },
    };
  });
  // console.log('ONE', clients[1].fantasyName, clients[1].name);
  if (one) return clients[0];
  return clients;
};