import React, { Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { connect } from 'react-redux';
import { Font } from '../../../../../../../../assets/fonts/font_names';
import SrvOrder from '../../../../../../../../services/Order';
import SrvProduct from '../../../../../../../../services/Product';
import { Price, InputText } from '../../../../../../../../components';
import { acTogglePanel, acSetEmbalamentos, acSetPanel, acCurrentProduct, acCurrentAcordeon } from '../../../../../../../../redux/actions/pages/cart';
import { acAssistant, acRemoveCartProduct, acSetGrades, acSetDropdownCarts, acSetCarts } from '../../../../../../../../redux/actions/pages/catalog';
import { acToggleMask } from '../../../../../../../../redux/actions/global';
import { hasCorInProduct, ativaCores, AtivaGrades, buscarGaleriaCores, agrupaCoresEGrades,
  calcDesconto, atualizaCarrinhoAtual, } from '../../../../../../../../utils/CommonFns';

export class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      totalCores: 0,
      selCores: 0,
      prazo: '',
      initPrazo: '',
      desconto: '',
      initDesconto: '',
    };
    this._mounted = false;
    this.openPainelEmbalamento = this.openPainelEmbalamento.bind(this);
    this.openPainelPrazo = this.openPainelPrazo.bind(this);
    this.openPainelDesconto = this.openPainelDesconto.bind(this);
  }

  componentDidMount() {
    this._mounted = true;
    const { produto } = this.props;
    this.updateSelectedColors();
    if ((produto.desconto || produto.prazo) && this._mounted) {
      this.setState({
        prazo: produto.prazo || '',
        initPrazo: produto.prazo || '',
        desconto: produto.desconto || '',
        initDesconto: produto.desconto || '',
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.dropdown !== this.props.dropdown) {
      this.updateSelectedColors();
    }
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  render() {
    const { type, produto, dropdown, pointerAcordeon, acSetDropdownCarts, acSetCarts } = this.props;
    const hasCor = !hasCorInProduct(dropdown.current.products, produto.code);
    const estaAberto = pointerAcordeon === produto.code;

    return (
      <View data-id="headerDoModelo" style={style.container}>
        {
          type === 'Carrinho' &&
            <TouchableOpacity
              onPress={this.openPainelCor}
              style={{ alignItems: 'center' }}
            >
              <Text style={{ fontFamily: Font.C, fontSize: 22, opacity: 0.5 }}>-</Text>
              <Text style={{ fontFamily: Font.ABold, fontSize: 10, opacity: 0.5 }}>{this.state.selCores}/{this.state.totalCores}</Text>
            </TouchableOpacity>
        }
        <View style={{ marginLeft: 10, minWidth: 300, }}>
          <Text style={{ fontFamily: Font.ASemiBold, fontSize: 14, marginBottom: 4 }}>{produto.code} - {produto.name}</Text>
          <Text style={{ fontFamily: Font.BSemiBold, fontSize: 10, color: 'rgba(0,0,0,.5)', paddingTop: 2 }}>[CHINELO FEMININO | GRUPO 1 | 12 PARES]</Text>
        </View>
        {/* embalamento */}
        <View style={{ marginLeft: 20, alignItems: 'center' }}>
          <Text style={{ fontFamily: Font.BSemiBold, fontSize: 11, marginBottom: 2 }}>EMBALAMENTO</Text>
          <View style={{ paddingTop: 4 }}>
            {
              type === 'Order' ?
                <Text style={{ fontFamily: Font.ARegular, fontSize: 14, }}>{produto.embalamento}</Text>
                :
                <TouchableOpacity onPress={this.openPainelEmbalamento}><Text style={style.label}>{produto.embalamento}</Text></TouchableOpacity>
            }
          </View>
        </View>
        {/* prazo */}
        <View style={{ marginLeft: 20, alignItems: 'center' }}>
          <Text style={{ fontFamily: Font.BSemiBold, fontSize: 11, marginBottom: 2 }}>PRAZO</Text>
          {
            this.props.type === 'Order' ?
              <Text style={{ marginTop: 4, fontFamily: Font.ARegular, fontSize: 14, }}>{this.state.prazo}</Text>
              :
              <InputText
                noClear
                txtInputStyle={{ fontSize: 12, textAlign: 'center' }}
                inputStyle={{ height: 25, width: 32, paddingLeft: null, marginRight: 5, backgroundColor: 'white', borderRadius: 6, borderColor: 'rgba(0,0,0,.3)', borderWidth: 1 }}
                value={this.state.prazo}
                maxLength={3}
                keyboardType="numeric"
                onChangeText={(prazo) => this.setState({ prazo })}
                onBlur={async () => {
                  if (this.state.initPrazo !== this.state.prazo) {
                    const { produto, dropdown, carts, } = this.props;
                    const cartDefault = carts.find(car => car.key === dropdown.current.key);
                    await SrvOrder.updatePrazoAllByModel({
                      order_sfa_guid__c: cartDefault.key,
                      ref1: produto.code,
                      sfa_prazo: this.state.prazo
                    });

                    cartDefault.products = await SrvOrder.getProdutos(
                      [{ order_sfa_guid__c: dropdown.current.key }],
                      { fields: ['sf_segmento_negocio__c'] });
                    await acSetDropdownCarts({ current: cartDefault, isVisible: false });
                  }
                }}
              />
          }
        </View>
        {/* desconto */}
        <View style={{ marginLeft: 20, alignItems: 'center', }}>
          <Text style={{ fontFamily: Font.BSemiBold, fontSize: 11, marginBottom: 2 }}>DESCONTO</Text>
          <View style={{ flexDirection: 'row' }}>
            {
              this.props.type === 'Order' ?
                <Text style={{ marginTop: 4, fontFamily: Font.ARegular, fontSize: 14, }}>{this.state.desconto}</Text>
                :
                <InputText
                  noClear
                  txtInputStyle={{ fontSize: 12, textAlign: 'center' }}
                  inputStyle={{ height: 25, width: 32, paddingLeft: null, marginRight: 3, backgroundColor: 'white', borderRadius: 6, borderColor: 'rgba(0,0,0,.3)', borderWidth: 1 }}
                  value={this.state.desconto}
                  maxLength={3}
                  keyboardType="numeric"
                  onChangeText={(desconto) => this.setState({ desconto })}
                  onBlur={async () => {
                    if (this.state.initDesconto !== this.state.desconto && this._mounted) {
                      this.setState({ initDesconto: this.state.desconto });
                      const { produto, dropdown, carts, } = this.props;
                      const produtos = dropdown.current.products.filter(p => p.code ===  produto.code);
                      produtos.forEach(p => {
                        const { key, quantity, sf_unit_price, } = p;
                        const totalPrice = sf_unit_price * quantity;
                        const totalComDesconto = calcDesconto(totalPrice, this.state.desconto);
                        const produtoItem = {
                          /* ... */
                          id: key,
                          sfa_desconto: this.state.desconto,
                          sf_total_price: totalComDesconto,
                        };
                        SrvOrder.updateProduto(produtoItem);
                      });

                      const cartDefault = carts.find(car => car.key === dropdown.current.key);
                      cartDefault.products = await SrvOrder.getProdutos(
                        [{ order_sfa_guid__c: dropdown.current.key }],
                        { fields: ['sf_segmento_negocio__c'] });
                      await acSetDropdownCarts({ current: cartDefault, isVisible: false });
                      const corGrade = await agrupaCoresEGrades(dropdown, produto);
                      this.props.acCurrentProduct({ ...produto, grades: corGrade.grades, colors: corGrade.colors });
                    }
                  }}
                />
            }
            <Text style={{ fontFamily: Font.ARegular, fontSize: 14, paddingTop: 4 }}>%</Text>
          </View>
        </View>
        {/* total do modelo */}
        <View style={{ marginLeft: 20, alignItems: 'center' }}>
          <Text style={{ fontFamily: Font.BSemiBold, fontSize: 11, marginBottom: 2 }}>TOTAL DO MODELO</Text>
          <View style={{ flexDirection: 'row', paddingTop: 4, alignItems: 'baseline' }}>
            <Text style={{ fontFamily: Font.ARegular, fontSize: 12, marginRight: 5 }}>R$</Text>
            <Price price={produto.totalPrice} style={{ fontFamily: Font.ARegular, fontSize: 14 }} />
          </View>
        </View>
        {/* gap */}
        <View style={{ flexGrow: 1 }} />
        {/* Botoes */}
        {
          type === 'Carrinho' &&
            <TouchableOpacity style={{ marginLeft: 4 }} onPress={this.deleteProduct}>
              <Text style={{ fontFamily: Font.C, fontSize: 22, opacity: 0.5 }}>w</Text>
            </TouchableOpacity>
        }
        {
          type === 'Carrinho' &&
            <TouchableOpacity style={{ marginLeft: 4 }}>
              <Text style={{ fontFamily: Font.C, fontSize: 22, opacity: 0.5 }}>i</Text>
            </TouchableOpacity>
        }
        {
          hasCor ?
            <TouchableOpacity style={{ width: 30 }} onPress={this._toggleItem}>
              <Text style={[{ fontFamily: Font.C, fontSize: 22, opacity: 0.5 }, (!estaAberto) ? { transform: [{ rotateZ: '90deg' }] } : { transform: [{ rotateZ: '-90deg' }] }]}>v</Text>
            </TouchableOpacity>
            :
            <View style={{ width: 30 }} />
        }
      </View>
    );
  }

  openPainelCor = async () => {
    const { produto, dropdown, acCurrentAcordeon, acCurrentProduct, acSetGrades, acAssistant, acSetPanel, acToggleMask, } = this.props;
    const corGrade = await agrupaCoresEGrades(dropdown, produto);
    await acCurrentProduct({ ...produto, grades: corGrade.grades, colors: corGrade.colors });
    acCurrentAcordeon(produto.code);

    // Busca e ativa grades.
    // const gradesCurrent = await SrvProduct.getGrades(produto.code);
    // const gradesAtivas = AtivaGrades(gradesCurrent, dropdown, produto.code);
    // acSetGrades(gradesAtivas.grades);

    // Busca e ativa cores.
    const coloresTotal = await buscarGaleriaCores(produto);
    const colors = ativaCores(coloresTotal, dropdown.current.products, produto.code);

    // Atualiza Panel.
    produto.gallery = [];
    acAssistant({ ...produto, colors }, true);

    // Abre Painel.
    acSetPanel(6, { title: `${colors.length} CORES DISPONÍVEIS` });
    acToggleMask();
  }

  async updateSelectedColors() {
    const { produto, dropdown } = this.props;
    // Busca e ativa cores.
    const colores = await buscarGaleriaCores(produto);
    const coloresAtiva = ativaCores(colores, dropdown.current.products, produto.code);
    if (this._mounted) {
      this.setState({
        totalCores: coloresAtiva.length,
        selCores: coloresAtiva.filter(p => p.isChosen).length
      });
    }
  }
  async openPainelEmbalamento() {
    const { produto, dropdown, acCurrentProduct, acSetPanel, acTogglePanel, acToggleMask, } = this.props;
    const corGrade = await agrupaCoresEGrades(dropdown, produto);
    acCurrentProduct({ ...produto, grades: corGrade.grades, colors: corGrade.colors, pointer: this.props.index, changeAll: true });
    acSetPanel(2);
    acTogglePanel();
    acToggleMask();
  }

  async openPainelPrazo() {
    const { produto, dropdown, acCurrentProduct, acSetPanel, acTogglePanel, acToggleMask } = this.props;
    const corGrade = await agrupaCoresEGrades(dropdown, produto);
    acCurrentProduct({ ...produto, grades: corGrade.grades, colors: corGrade.colors, pointer: this.props.index, changeAll: true });
    acSetPanel(1);
    acTogglePanel();
    acToggleMask();
  }

  async openPainelDesconto() {
    const { produto, dropdown, acCurrentProduct, acSetPanel, acTogglePanel, acToggleMask } = this.props;
    const corGrade = await agrupaCoresEGrades(dropdown, produto);
    acCurrentProduct({ ...produto, grades: corGrade.grades, colors: corGrade.colors, pointer: this.props.index, changeAll: true });
    acSetPanel(9);
    acTogglePanel();
    acToggleMask();
  }

  deleteProduct = async () => {
    const { produto, carts, dropdown, acSetDropdownCarts, acRemoveCartProduct } = this.props;
    const { code } = produto;
    await acRemoveCartProduct({ code });
    await SrvOrder.removerProdutosByModel(code, dropdown.current.key);
    const cartDefault = carts.find(car => car.key === dropdown.current.key);
    cartDefault.products = await SrvOrder.getProdutos(
      [{ order_sfa_guid__c: dropdown.current.key }],
      { fields: ['sf_segmento_negocio__c'] });
    await acSetDropdownCarts({ current: cartDefault, isVisible: false });
  }

  _toggleItem = async () => {
    const { produto, dropdown, pointerAcordeon, acCurrentProduct, acCurrentAcordeon } = this.props;
    const estaAberto = pointerAcordeon === produto.code;

    if (estaAberto) {
      acCurrentProduct({ grades: [], colors: [], });
      acCurrentAcordeon(null);
    } else {
      const corGrade = await agrupaCoresEGrades(dropdown, produto);
      await acCurrentProduct({ ...this.props.produto, grades: corGrade.grades, colors: corGrade.colors, pointer: this.props.index });
      acCurrentAcordeon(produto.code);
    }
  }
}

const mapStateToProps = (state) => ({
  pointerAcordeon: state.cart.pointerAcordeon,
         dropdown: state.catalog.dropdown,
            carts: state.catalog.carts,

});

const mapDispatchToProps = {
  acTogglePanel,
  acSetEmbalamentos,
  acSetPanel,
  acCurrentProduct,
  acAssistant,
  acRemoveCartProduct,
  acToggleMask,
  acCurrentAcordeon,
  acSetGrades,
  acSetDropdownCarts,
  acSetCarts,
};

export default connect(mapStateToProps, mapDispatchToProps)(Header);

const style = StyleSheet.create({
  label: {
    fontFamily: Font.ARegular,
    fontSize: 14,
    color: '#0085B2',
    textDecorationColor: '#0085B2',
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid'
  },
  labelTouch: {
    fontFamily: Font.ARegular,
    fontSize: 14,
    color: '#0085B2',
    textDecorationColor: '#0085B2',
    textDecorationStyle: 'solid'
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  }
});
