import { repository, queryBuilder as query } from '../Repository/OrderDb';
import { repository as prodRepo } from '../Repository/ProductDb';
import moment from 'moment';
import uuidv4 from 'uuid/v4';
import SrvProduct from '../../services/Product';
import { asyncForEach, agrupaProdutosNoCarrinho, calcDesconto } from '../../utils/CommonFns';

class Order {
  static async saveParameter(name, value) {
    const repo = await repository();
    return repo.param.set(name, value);
  }

  /* CARRINHO */

  // Cria carrinho.
  static async addCarrinho({
    sfa_nome_carrinho,
    sfa_carrinho_selecionado,
    sf_account_id,
    sfa_nome_cliente,
    sf_pricebook2id,
    sfa_pricebook2_name,
    sf_previsao_embarque__c,
  }) {
    const repo = await repository();
    // console.log('sf_previsao_embarque__c', sf_previsao_embarque__c);
    const uuid = uuidv4();
    const carrinho = {
      id: uuid,
      is_active: true,
      is_deleted: false,
      sf_sfa_guid__c: uuid,
      sf_status: 'Draft',

      sfa_nome_carrinho,
      sfa_carrinho_selecionado,
      sf_account_id,
      sfa_nome_cliente,
      sf_pricebook2id,
      sfa_pricebook2_name,
      sfa_previsao_embarque__c: sf_previsao_embarque__c,
    };
    return repo.upsert('sf_order', carrinho);
  }

  // Exclui um carrinho.
  static async removeCarrinho(id) {
    const repo = await repository();

    const carrinho = {
      id,
      is_deleted: true
    };

    repo.upsert('sf_order', carrinho);
  }

  // Obtem lista de carrinhos.
  static async getCarrinhos(filtros = [], orderBy, isDesc = false) {
    const repo = await repository();

    let select = query
      .select()
      .field('id')
      .field('sfa_nome_carrinho')
      .field('sf_account_id')
      .field('sfa_nome_cliente')
      .field('sfa_carrinho_selecionado')
      .field('sf_pricebook2id')
      .field('sfa_pricebook2_name')
      .field('updated_at')
      .field("COALESCE(sfa_previsao_embarque__c, '[NULO]')", 'sfa_previsao_embarque__c')
      .field('COALESCE(sf_total_amount, 0)', 'sf_total_amount')
      .field("COALESCE(sfa_ordem_compra__c, '[NULO]')", 'sfa_ordem_compra__c')
      .field("COALESCE(sfa_prazo_adicional__c, '[NULO]')", 'sfa_prazo_adicional__c')
      .field("COALESCE(sfa_desconto_adicional__c, '[NULO]')", 'sfa_desconto_adicional__c')
      .field("COALESCE(sfa_condicoes_pagamento__c, '[NULO]')", 'sfa_condicoes_pagamento__c')
      .field("COALESCE(sfa_pre_data_entrega__c, '[NULO]')", 'sfa_pre_data_entrega__c')
      .field("COALESCE(sfa_periodo_entrega__c, '[NULO]')", 'sfa_periodo_entrega__c')
      .field("COALESCE(sfa_reposicao__c, '[NULO]')", 'sfa_reposicao__c')
      .field("COALESCE(sfa_codigo_totvs__c, '[NULO]')", 'sfa_codigo_totvs__c')
      .from('sf_order')
      .where('is_deleted = ?', false)
      .where('sf_status_code is null');

    if (!orderBy) {
      select.order('sfa_nome_cliente');
    } else {
      orderBy.forEach(field => {
        select.order(field, isDesc);
      });
    }

    filtros.map(filtro => {
      select = select.where(`${Object.keys(filtro)[0]} = ?`, `${Object.values(filtro)[0]}`);
    });

    const carrinhos = await repo.query(select);
    return this.mapToCarts(carrinhos._array);
  }

  static async getPedidos(filtros = [], orderBy, isDesc = false) {
    const repo = await repository();

    let select = query
      .select()
      .field('id')
      .field('sfa_nome_carrinho')
      .field('sf_account_id')
      .field('sfa_nome_cliente')
      .field('sfa_carrinho_selecionado')
      .field('sf_pricebook2id')
      .field('sfa_pricebook2_name')
      .field('updated_at')
      .field("COALESCE(sfa_previsao_embarque__c, '[NULO]')", 'sfa_previsao_embarque__c')
      .field('COALESCE(sf_total_amount, 0)', 'sf_total_amount')
      .field("COALESCE(sfa_ordem_compra__c, '[NULO]')", 'sfa_ordem_compra__c')
      .field("COALESCE(sfa_prazo_adicional__c, '[NULO]')", 'sfa_prazo_adicional__c')
      .field("COALESCE(sfa_desconto_adicional__c, '[NULO]')", 'sfa_desconto_adicional__c')
      .field("COALESCE(sfa_condicoes_pagamento__c, '[NULO]')", 'sfa_condicoes_pagamento__c')
      .field("COALESCE(sfa_pre_data_entrega__c, '[NULO]')", 'sfa_pre_data_entrega__c')
      .field("COALESCE(sfa_periodo_entrega__c, '[NULO]')", 'sfa_periodo_entrega__c')
      .field("COALESCE(sfa_reposicao__c, '[NULO]')", 'sfa_reposicao__c')
      .field("COALESCE(sfa_codigo_totvs__c, '[NULO]')", 'sfa_codigo_totvs__c')
      .from('sf_order')
      .where('is_deleted = ?', false)
      .where('sf_status_code = ?', 'COMPLETED');

    if (!orderBy) {
      select.order('sfa_nome_cliente');
    } else {
      orderBy.forEach(field => {
        select.order(field, isDesc);
      });
    }

    filtros.map(filtro => {
      select = select.where(`${Object.keys(filtro)[0]} = ?`, Object.values(filtro)[0]);
    });

    const carrinhos = await repo.query(select);
    return this.mapToCarts(carrinhos._array);
  }

  // Cria carrinho padrão
  static async criarCarrinhoPadrao(client, currentTable) {
    const carrinhoPadrao = 'Carrinho Padrão';

    const filtro = [
      { sf_account_id: client.sf_id },
      { sf_pricebook2id: currentTable.code },
      { sfa_nome_carrinho: carrinhoPadrao },
    ];

    const carrinhos = await this.getCarrinhos(filtro);

    if (carrinhos.length === 0) {
      this.resetCarrinhoPadrao(filtro);
      const cart = await this.addCarrinho({
        sfa_nome_carrinho: carrinhoPadrao,
        sfa_carrinho_selecionado: 'true',
        sf_account_id: client.sf_id,
        sfa_nome_cliente: client.fantasyName,
        sf_pricebook2id: currentTable.code,
        sfa_pricebook2_name: currentTable.name,
        sf_previsao_embarque__c: currentTable.mesFatur,
      });
      return this.mapToCarts(cart);
    }

    const carrinhoDefault = carrinhos[0];
    carrinhoDefault.isDefault = true;

    await this.updateCarrnho({
      id: carrinhoDefault.key,
      sfa_carrinho_selecionado: 'true',
    });

    return carrinhoDefault;
  }

  // Atualiza um carrinho.
  static async updateCarrnho({ id, sfa_carrinho_selecionado, }, fields) {
    const repo = await repository();

    let carrinho = { id };
    if (fields) carrinho = { id, ...fields };
    if (sfa_carrinho_selecionado) {
      carrinho.sfa_carrinho_selecionado = sfa_carrinho_selecionado;
    }

    //debugger
    let carUpdate = await repo.upsert('sf_order', carrinho);

    return {
      key: carUpdate.id,
      name: carUpdate.sfa_nome_carrinho,
      clientName: carUpdate.sfa_nome_cliente,
      isDefault: carUpdate.sfa_carrinho_selecionado,
    };
  }

  // Deixa todos os carrinhos ativos de um cliente sem carrinho selecionado "Default".
  static async resetCarrinhoPadrao(filtro) {
    const carrinhos = await this.getCarrinhos(filtro);
    await asyncForEach(carrinhos, async (c) => {
      await this.updateCarrnho({
        id: c.key,
        sfa_carrinho_selecionado: 'false',
      });
    });

    return 'Definido todos os carrinhos ativos sem default';
  }

  static async customQuery(query, queryOne) {
    const repo = await repository();
    let result = null;
    if (queryOne) {
      result = await repo.queryOne(query);
    } else {
      result = (await repo.query(query))._array;
    }
    // console.log('query', query.toString());
    return result;
  }

  /* PRODUTO */
  // Adiciona produto dentro de um carrinho.
  static async addProduto({
    order_sfa_guid__c,
    ref1,
    ref2,
    ref3,
    ref4,
    sf_quantity,
    sf_description,
    sfa_photo_file_name,
    sf_pricebook_entry_id,
    sf_list_price,
    sfa_sum_of_pairs,
    sf_unit_price,
    sfa_prazo,
    sfa_desconto,
  }) {
    const repo = await repository();

    const uuid = uuidv4();

    const produto = {
      id: uuid,
      is_active: true,
      is_deleted: false,
      sf_sfa_guid__c: uuid,
    };

    if (order_sfa_guid__c) produto.order_sfa_guid__c = order_sfa_guid__c;
    if (ref1) produto.ref1 = ref1;
    if (ref2) produto.ref2 = ref2;
    if (ref3) produto.ref3 = ref3;
    if (ref4) produto.ref4 = ref4;
    if (sf_quantity) produto.sf_quantity = sf_quantity;
    if (sf_description) produto.sf_description = sf_description;
    if (sfa_photo_file_name) produto.sfa_photo_file_name = sfa_photo_file_name;
    if (sf_pricebook_entry_id) produto.sf_pricebook_entry_id = sf_pricebook_entry_id;
    if (sf_list_price) produto.sf_list_price = sf_list_price;
    if (sfa_sum_of_pairs) produto.sfa_sum_of_pairs = sfa_sum_of_pairs;
    if (sf_unit_price) produto.sf_unit_price = sf_unit_price;
    if (sfa_prazo) produto.sfa_prazo = sfa_prazo;
    if (sfa_desconto) produto.sfa_desconto = sfa_desconto;

    const item = await repo.upsert('sf_order_item', produto);

    return {
      key: item.id,
      name: item.sf_description,
      code: item.ref1,
      ref1: item.ref1,
      ref2: item.ref2,
      ref3: item.ref3,
      ref4: item.ref4,
      quantity: item.sf_quantity,
      embalamento: item.ref4,
      prazo: item.sfa_prazo,
      desconto: item.sfa_desconto,
      sf_pricebook_entry_id: item.sf_pricebook_entry_id,
      sf_unit_price: item.sf_unit_price,
      sf_list_price: item.sf_list_price,
      sf_total_price: item.sf_total_price,
      createdAt: new Date(item.created_at),
      uri: item.sfa_photo_file_name,
      sfa_sum_of_pairs: item.sfa_sum_of_pairs,
      totalPrice: 0,
    };
  }

  // Atualiza produto dentro de um carrinho.
  static async updateProduto(produto) {
    const repo = await repository();
    let newProduct = await repo.upsert('sf_order_item', produto);
    return {
      key: newProduct.id,
      name: newProduct.sf_description,
      code: newProduct.id,
      quantity: newProduct.sf_quantity,
      ref1: newProduct.ref1,
      ref2: newProduct.ref2,
      ref3: newProduct.ref3,
      ref4: newProduct.ref4,
    };
  }

  static async updatePriceAllByModel({ order_sfa_guid__c, ref1, ref4, sfa_desconto, }) {
    const repo = await repository();

    const todosProtudos = await this.getProdutos([{ ref1 }, { order_sfa_guid__c }]);

    await asyncForEach(todosProtudos, async (produto) => {
      const { key, ref2, quantity, sf_pricebook_entry_id } = produto;
      if (ref2) {
        const prices = await SrvProduct.getPriceProduct(sf_pricebook_entry_id, ref1, ref2);
        const price = prices.find(p => p.ref4 === ref4);
        if (quantity && price) {
          const { sf_unit_price } = price;
          const sf_total_price = quantity * sf_unit_price;
          let totalComDesconto = null;
          if (sfa_desconto) {
            totalComDesconto = calcDesconto(sf_total_price, sfa_desconto);
          }

          const update = query
            .update()
            .table('sf_order_item')
            .where('id = ?', key);

          if (sf_unit_price) update.set('sf_unit_price', sf_unit_price);
          if (totalComDesconto) {
            update.set('sf_total_price', totalComDesconto);
          } else if (sf_total_price) {
            update.set('sf_total_price', sf_total_price);
          }

          await repo.exec(update.toString(), null);
        }
      }
    });
  }

  static async updatePrazoAllByModel({ order_sfa_guid__c, ref1, sfa_prazo, }) {
    const repo = await repository();

    const update = query
      .update()
      .table('sf_order_item')
      .where('order_sfa_guid__c = ?', order_sfa_guid__c)
      .where('ref1 = ?', ref1);

    if (sfa_prazo) {
      update.set('sfa_prazo', sfa_prazo);
    } else {
      update.set('sfa_prazo', null);
    }

    await repo.exec(update.toString(), null);
  }

  static async updateDescontoAllByModel({ order_sfa_guid__c, ref1, sfa_desconto, sf_total_price, }) {
    const repo = await repository();

    const update = query
      .update()
      .table('sf_order_item')
      .where('order_sfa_guid__c = ?', order_sfa_guid__c)
      .where('ref1 = ?', ref1);

    if (sfa_desconto) {
      update.set('sfa_desconto', sfa_desconto);
    } else {
      update.set('sfa_desconto', null);
    }

    if (sf_total_price) {
      update.set('sf_total_price', sf_total_price);
    } else {
      update.set('sf_total_price', null);
    }

    await repo.exec(update.toString(), null);
  }

  static async updateEmbalamentoAllByModel({ order_sfa_guid__c, ref1, ref4, sf_unit_price, }) {
    const repo = await repository();

    const update = query
      .update()
      .table('sf_order_item')
      .where('order_sfa_guid__c = ?', order_sfa_guid__c)
      .where('ref1 = ?', ref1);

    if (ref4) {
      update.set('ref4', ref4);
    } else {
      update.set('ref4', null);
    }

    if (sf_unit_price) {
      update.set('sf_unit_price', sf_unit_price);
    } else {
      update.set('sf_unit_price', null);
    }

    await repo.exec(update.toString(), null);
  }

  // Remove produtos dentro de um carrinho.
  static async removerProduto(id) {
    const repo = await repository();

    const produto = {
      id,
      is_deleted: true
    };

    repo.upsert('sf_order_item', produto);
  }

  static async removerProdutosByModel(ref1, order_sfa_guid__c) {
    const produtos = await this.getProdutos([
      { ref1 },
      { order_sfa_guid__c },
    ]);

    await asyncForEach(produtos, async (p) => {
      await this.removerProduto(p.key);
    });

    return 'Produtos removidos por grade';
  }

  static async removerProdutosByGrade(ref1, ref3, order_sfa_guid__c) {
    const produtos = await this.getProdutos([
      { ref1 },
      { ref3 },
      { order_sfa_guid__c }
    ]);

    await asyncForEach(produtos, async (p) => {
      await this.removerProduto(p.key);
    });

    return 'Produtos removidos por grade';
  }

  static async removerProdutosByCor(ref1, ref2, order_sfa_guid__c) {
    const produtos = await this.getProdutos([
      { ref1 },
      { ref2 },
      { order_sfa_guid__c }
    ]);

    await asyncForEach(produtos, async (p) => {
      await this.removerProduto(p.key);
    });

    return 'Produtos removidos pela cor';
  }

  static async removerProdutosByModeloCorGrade(ref1, ref2, ref3, order_sfa_guid__c) {
    const produtos = await this.getProdutos([
      { ref1 },
      { ref2 },
      { ref3 },
      { order_sfa_guid__c }
    ]);

    await asyncForEach(produtos, async (p) => {
      await this.removerProduto(p.key);
    });

    return 'Produtos removidos por grade';
  }

  static async removerProdutosComGradesNulas(order_sfa_guid__c, ref1, ref2) {
    const repo = await repository();

    let select = query
      .select()
      .field('id')
      .from('sf_order_item')
      .where('is_deleted = ?', false)
      .where('order_sfa_guid__c = ?', order_sfa_guid__c)
      .where('ref1 = ?', ref1)
      .where('ref3 IS NULL');

    if (ref2) {
      select = select.where('ref2 = ?', ref2);
    }

    const produtos = await repo.query(select);

    await asyncForEach(produtos._array, async (p) => {
      await this.removerProduto(p.id);
    });

    return 'Produtos removidos por grade';
  }

  static async removerProdutosComCoresNulas(order_sfa_guid__c, ref1) {
    const repo = await repository();

    let select = query
      .select()
      .field('id')
      .from('sf_order_item')
      .where('is_deleted = ?', false)
      .where('order_sfa_guid__c = ?', order_sfa_guid__c)
      .where('ref1 = ?', ref1)
      .where('ref2 IS NULL');

    const produtos = await repo.query(select);

    await asyncForEach(produtos._array, async (p) => {
      await this.removerProduto(p.id);
    });

    return 'Produtos removidos por grade';
  }

  static async removerProdutosComCoresGradesNulas(order_sfa_guid__c, ref1) {
    const repo = await repository();

    let select = query
      .select()
      .field('id')
      .from('sf_order_item')
      .where('is_deleted = ?', false)
      .where('order_sfa_guid__c = ?', order_sfa_guid__c)
      .where('ref1 = ?', ref1)
      .where('ref2 IS NULL')
      .where('ref3 IS NULL');

    const produtos = await repo.query(select);

    await asyncForEach(produtos._array, async (p) => {
      await this.removerProduto(p.id);
    });

    return 'Produtos removidos por grade';
  }

  static async removerProdutosByCorGrade(ref1, ref2, ref3, order_sfa_guid__c) {
    const produtos = await this.getProdutos([
      { ref1 },
      { ref2 },
      { ref3 },
      { order_sfa_guid__c },
    ]);

    await asyncForEach(produtos, async (p) => {
      await this.removerProduto(p.key);
    });

    return 'Produtos removidos por grade';
  }

  static async getProdutos(filtros = [], queryAttributes) {
    const repo = await repository();

    let select = query
      .select()
      .field('id')
      .field('sf_description')
      .field('created_at')
      .field('ref1')
      .field('ref2')
      .field('ref3')
      .field('ref4')
      .field('sf_unit_price')
      .field('sf_list_price')
      .field('sf_total_price')
      .field('sf_quantity')
      .field('sfa_embalamento')
      .field('sfa_prazo')
      .field('sfa_desconto')
      .field('sfa_photo_file_name')
      .field('sf_pricebook_entry_id')
      .field('sfa_sum_of_pairs')
      .from('sf_order_item')
      .where('is_deleted = ?', false)
      .order('sf_description')
      .order('ref1')
      .order('ref2')
      .order('ref3');
    filtros.map(filtro => {
      select = select
        .where(`${Object.keys(filtro)[0]} = '${Object.values(filtro)[0]}'`);
    });

    const produtos = await repo.query(select);

    let atts = null;
    const ref1s = [];
    produtos._array.forEach(({ ref1 }) => {
      ref1s.push(ref1);
    });

    if (queryAttributes && ref1s.length > 0) {
      const selectAtts = query.select().field('ref1').from('sfa_product_att').order('ref1');
      selectAtts.where('ref1 IN ?', ref1s);
      queryAttributes.fields.forEach(field => selectAtts.field(field));
      const pRepo = await prodRepo();
      atts = (await pRepo.query(selectAtts))._array;
    }

    return this.mapToProducts(produtos._array, atts);
  }

  static async atualizaProduto({ ref1, sfa_prazo, ref4 }) {
    const repo = await repository();

    let select = query
      .select()
      .from('sf_order_item')
      .where('is_deleted = ?', false)
      .where('ref1 = ?', ref1);

    const p = await repo.queryOne(select);
    if (ref4) p.ref4 = ref4;
    p.sfa_prazo = sfa_prazo;

    const produtoAtualizado = await repo.upsert('sf_order_item', p);

    return {
      key: produtoAtualizado.id,
      name: produtoAtualizado.sf_description,
      code: produtoAtualizado.ref1,
      ref1: produtoAtualizado.ref1,
      ref4: produtoAtualizado.ref4,
      prazo: produtoAtualizado.sfa_prazo,
    };
  }

  // Mappers
  static mapToCarts(obj) {
    const isArray = Array.isArray(obj);
    let mappedCarts = null;
    // Senão for um vetor de carrinhos, mapeamos diretamente somente um objeto
    if (isArray) {
      mappedCarts = obj.map(this.mapToCart);
    } else {
      mappedCarts = this.mapToCart(obj);
    }
    return mappedCarts;
  }

  static mapToProducts(arr, atts) {
    const groupedProducts = agrupaProdutosNoCarrinho(arr);
    return arr.map((item, index) => {
      const p = groupedProducts.find(p => item.ref1 === p.code);
      let prod = {
        key: item.id,
        name: item.sf_description,
        code: item.ref1,
        ref1: item.ref1,
        ref2: item.ref2,
        ref3: item.ref3,
        ref4: item.ref4,
        quantity: item.sf_quantity,
        embalamento: item.ref4,
        prazo: item.sfa_prazo,
        desconto: item.sfa_desconto,
        sf_pricebook_entry_id: item.sf_pricebook_entry_id,
        sf_unit_price: item.sf_unit_price,
        sf_list_price: item.sf_list_price,
        sf_total_price: item.sf_total_price,
        createdAt: new Date(item.created_at),
        uri: item.sfa_photo_file_name,
        sfa_sum_of_pairs: item.sfa_sum_of_pairs,
        totalPrice: p.totalPrice || 0,
      };


      if (atts) {
        // Encontra o atributo de acordo com o código do produto
        // Como a modelagem do order_item permite multiplos registros com o mesmo código,
        // Todos devem receber os atributos.
        const attIndex = atts.findIndex(({ ref1 }) => ref1 === item.ref1);
        if (attIndex > -1) {
          prod = { ...prod, segmento: atts[attIndex].sf_segmento_negocio__c, };
        }
      }

      return prod;
    });
  }

  static mapToCart = (item) => {
    return {
      key: item.id,
      name: item.sfa_nome_carrinho,
      products: [],
      standard: item.sfa_carrinho_selecionado === 'true',
      isDefault: item.sfa_carrinho_selecionado === 'true',
      isChosen: item.sfa_carrinho_selecionado === 'true',
      client: item.sfa_nome_cliente,
      clientId: item.sf_account_id,
      sf_pricebook2id: item.sf_pricebook2id,
      sfa_pricebook2_name: item.sfa_pricebook2_name,
      sf_account_id: item.sf_account_id,
      updateAt: item.updated_at,
      nItens: 0,
      valor: '0',
      totalAmount: item.sf_total_amount ? item.sf_total_amount.toString() : '0',
      created: {
        day: moment().day(),
        month: moment()
          .format('MMMM')
          .substring(0, 3)
          .toUpperCase(),
        year: moment().year()
      },
      previsaoEmbarque: item.sfa_previsao_embarque__c,
      orderDeCompra: item.sfa_ordem_compra__c,
      prazoAdicional: item.sfa_prazo_adicional__c,
      descontoAdicional: item.sfa_desconto_adicional__c,
      condicoesPagamento: item.sfa_condicoes_pagamento__c,
      preDataEntrega: item.sfa_pre_data_entrega__c,
      periodoEntrega: item.sfa_periodo_entrega__c,
      reposicao: item.sfa_reposicao__c,
      codigoTotvs: item.sfa_codigo_totvs__c,

    };
  }
}

export default Order;