import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { DropDownView } from '.';
import SrvClients from '../../../services/Account';
import { Button, Fade, Row, InputText, SimpleButton, Filters } from '../../../components';
import global from '../../../assets/styles/global';
import { asyncForEach } from '../../../utils/CommonFns';
import SrvOrder from '../../../services/Order';

class FilterPopUp extends React.Component {
  constructor(props) {
    super(props);
    let txtName = '';
    this.state = {
      txtName,
    };
  }
  render() {
      const {
        acUpdateComponent, acFilterList, panelFilter, SrvClients,
        acSetResultFinder, acUpdateCurrent, acToggleMask
      } = this.props;
      if (!this.props.isVisible) return null;

      this.hasFilters = panelFilter.find(({ current }) => current !== '') || this.state.txtName !== '';
      return (
        <View style={global.flexOne}>
          <View style={{ borderBottomWidth: 1, width: '100%', borderBottomColor: '#CCC', paddingBottom: 10 }}>
            <Text style={[global.txtLabel, { fontSize: 11, marginBottom: 2 }]}>CARRINHO(NOME)</Text>
            <InputText
              inputStyle={{ width: '100%' }}
              onChangeText={(text) => {
                this.setState({ txtName: text });
              }
              }
              clearAction={() => {
                this.setState({ txtName: '' });
                this.props.acUpdateCurrent('textName', '', true);
              }}
              value={this.state.txtName}
            />
          </View>
          <ScrollView style={[{ flex: 1, paddingTop: 20 }, global.separatorBorder]}>
            <Filters
              hasTitle
              title={panelFilter[5].desc.toUpperCase()}
              name={panelFilter[5].name}
              pointerFilter={5}
              setFilterStack={this.props.acSetFilterStack}
              currStack={panelFilter[5].currStack}
              filters={panelFilter[5].options}
              current={panelFilter[5].current}
              chooseFilter={this.chooseFilter}
              containerStyle={styles.vwFilters}
            />
          </ScrollView>
          <View style={{ paddingVertical: 15, alignItems: 'center' }}>
            <SimpleButton
              msg="BUSCAR"
              action={this.searchClicked}
              tchbStyle={{ height: 36 }}
            />
          </View>
        </View>
      );
  }

  chooseFilter = (item, index, name) => {
    this.props.acUpdateComponent('dropdown', name);
    this.props.acUpdateCurrent(name, item.option, true);
  }

  searchClicked = async () => {
    await this.props.acUpdateCurrent('textName', this.state.txtName, true);
    const { panelFilter, context, acSetCarts, acSetDropdownCarts, } = this.props;

    if (!this.hasFilters) {
      this.chooseFilter({ option: 'TODOS OS CARRINHOS' }, 2, 'textName');
    }
    this.props.acCopyPanelFilter();
    this.props.acSetResultFinder(true);

    let carts = [];
    if (context === 'Admin') {
      carts = await SrvOrder.getCarrinhos();
    } else if (context === 'Vendedor') {
      const filtro = [{ sf_account_id: this.props.client.sf_id },];
      carts = await SrvOrder.getCarrinhos(filtro);
    }

    await asyncForEach(carts, async (car) => {
      car.products = await SrvOrder
        .getProdutos(
          [{ order_sfa_guid__c: car.key }],
          { fields: ['sf_segmento_negocio__c'] }
        );
    });

    // TRANSFERIR ESTE FILTRO PARA QUERIES.
    // Retira pedidos sem produtos.
    carts = carts.filter(c => c.products.length > 0);

    // Filtro de nome ou codigo.
    if (this.state.txtName) {
      carts = carts.filter(c => {
        const testeLogicoA = c.client.toLowerCase().indexOf(this.state.txtName.toLowerCase());
        const testeLogicoB = c.name.toLowerCase().indexOf(this.state.txtName.toLowerCase());
        const resultadoA = testeLogicoA > -1;
        const resultadoB = testeLogicoB > -1;
        return resultadoA || resultadoB;
      });
    }

    if (panelFilter[5].current) {
      carts = carts.filter(c => c.sfa_pricebook2_name === panelFilter[5].current);
    }

    acSetCarts(carts);

    const cartDefault = carts.find(car => car.isDefault);
    acSetDropdownCarts({
      current: cartDefault,
      isVisible: false
    });

    this.props.acToggleMask();
    this.props.acCloseClientModals();
  }
}

export default FilterPopUp;

const styles = StyleSheet.create({
  vwFilters: {
    marginBottom: 12,
  },
});