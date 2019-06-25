import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, } from 'react-native';
import { connect } from 'react-redux';
import { Font } from '../../../../../assets/fonts/font_names';
import { Item } from './common';
import { atualizarCarrinhos, asyncForEach } from '../../../../../utils/CommonFns';
import SrvOrder from '../../../../../services/Order/';
import { acSetDropdownCarts, } from '../../../../../redux/actions/pages/catalog';

class TabProdutos extends React.PureComponent {
  render() {
    const { type, products, dropdown, carts, acSetDropdownCarts, } = this.props;
    return (
      <View>
        <View>
          {/* BUSCA POR PRODUTOS */}
          {/* <View style={styles.vwBuscaPorProd}>
            <View style={styles.vwSearch}>
              <InputText
                inputStyle={styles.inputSearch}
                value=""
              />
              <TouchableOpacity
                style={styles.btnBuscar}>
                  <Text style={styles.txtBuscar}>BUSCAR</Text>
              </TouchableOpacity>
            </View>
          </View> */}
          {/* LISTA DE PRODUTOS PESQUISADOS */}
          {/* <ScrollView horizontal style={{ marginTop: 8 }}>
            <ItemBuscaCarrinho selecionado cota />
            <ItemBuscaCarrinho selecionado={false} cota={false} />
            <ItemBuscaCarrinho selecionado cota={false} />
            <ItemBuscaCarrinho selecionado={false} cota />
          </ScrollView> */}

          {/* Cabecalho da lista de produtos */}
          <View style={styles.vwListHeader}>
            <View style={styles.flexGrow1}>
              <Text style={styles.txtTotalProducts}>{`${products.length} produto`}{dropdown.current.products.length > 1 && 's'}</Text>
            </View>
            <View style={styles.flexRoww}>
              {
                type === 'Carrinho' &&
                <TouchableOpacity
                  style={styles.marginLeft4}
                  onPress={async () => {
                    await asyncForEach(products, async (product) => SrvOrder.removerProdutosByModel(product.code, dropdown.current.key));
                    const cartDefault = carts.find(car => car.key === dropdown.current.key);
                    cartDefault.products = await SrvOrder.getProdutos(
                      [{ order_sfa_guid__c: dropdown.current.key }],
                      { fields: ['sf_segmento_negocio__c'] });
                    await acSetDropdownCarts({ current: cartDefault, isVisible: false });
                  }}
                >
                  <Text style={styles.icon}>w</Text>
                </TouchableOpacity>
              }
              {
                type === 'Carrinho' &&
                <TouchableOpacity style={styles.marginLeft4}>
                  <Text style={styles.icon}>h</Text>
                </TouchableOpacity>
              }
              {/* gap botão */}
              <View style={styles.buttonGap} />
            </View>
          </View>
          <View data-id="containerDeProdutos">
            <FlatList
              data={products}
              renderItem={this.renderProducts}
              keyExtractor={(item) => item.code}
            />
          </View>
        </View>
      </View>
    );
  }

  renderProducts = ({ item, index, }) => {
    return (
      <Item
        key={item.code}
        index={index}
        produto={item}
        type={this.props.type}
      />
    );
  }
}

const mapStateToProps = (state) => ({
  dropdown: state.catalog.dropdown,
     carts: state.catalog.carts,
});

const mapDispatchToProps = {
  acSetDropdownCarts
};

TabProdutos.defaultProps = {
  products: []
};

export default connect(mapStateToProps, mapDispatchToProps)(TabProdutos);

const styles = StyleSheet.create({
  icon: {
    fontFamily: Font.C,
    fontSize: 22,
    opacity: 0.5
  },
  marginLeft4: {
    marginLeft: 4
  },
  vwBuscaPorProd: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  vwSearch: {
    flexGrow: 1,
    flexDirection: 'row',
    maxWidth: 800,
  },
  inputSearch: {
    flexGrow: 1,
    height: 32,
    marginTop: 0
  },
  btnBuscar: {
    flexShrink: 1,
    justifyContent: 'center',
    marginLeft: 20,
    backgroundColor: '#0085B2',
    borderRadius: 17,
    paddingHorizontal: 20,
    height: 32,
  },
  txtBuscar: {
    color: 'white',
    fontFamily: Font.ASemiBold,
    fontSize: 14,
  },
  vwListHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 5,
    borderBottomColor: 'rgba(0,0,0,.2)',
    borderBottomWidth: 1
  },
  txtTotalProducts: {
    fontFamily: Font.ALight,
    fontSize: 16,
    color: 'rgba(0,0,0,.85)',
  },
  flexGrow1: {
    flexGrow: 1
  },
  flexRoww: {
    flexDirection: 'row'
  },
  buttonGap: {
    width: 30
  },
});