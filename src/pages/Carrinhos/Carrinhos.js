import React from 'react';
import { View, StyleSheet, Platform, ImageBackground, Animated, Text, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';
import * as reducersClients from '../../redux/actions/pages/clients';
import * as cartsActions from '../../redux/actions/pages/carts';
import global from '../../assets/styles/global';
import { acCurrentClient as acSetCurrentClient } from '../../redux/actions/pages/client';
import { acToggleMask } from '../../redux/actions/global';
import { acSetCarts, acSetDropdownCarts } from '../../redux/actions/pages/catalog';
import { acCurrentProduct } from '../../redux/actions/pages/cart';
import { backgroundVendor, backgroundAdmin } from '../../assets/images';
import { Font } from '../../assets/fonts/font_names';
import {
  Button, Fade, Title, Row, TranslucidHeader, ModalMask,
  InfoMsg, Panel, TableList, SortBy, Price, TextLimit, DisableComponent,
} from '../../components';
import { FilterPopUp, SummaryList, SortPopUp, } from './components';
import { HEADER_HEIGHT } from '../Catalog/Catalog';
import SrvOrder from '../../services/Order/';
import SrvProduct from '../../services/Product';
import SrvClients from '../../services/Account';
import { anyIsSelected } from '../../redux/reducers/pages/common/functions';
import { asyncForEach } from '../../utils/CommonFns';
import { acCloseSubMenus } from '../../redux/actions/pages/menu';
import { BtnToggleList } from '../Clients/Clients';
import { cartBoxClicked } from '../../services/Pages/Cart/Queries';

class Carrinhos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listHeight: new Animated.Value(0)
    };
    this._isFirstMount = true;
    this.setListHeight = this.setListHeight.bind(this);
    this.btnMenuClicked = this.btnMenuClicked.bind(this);
  }

  async componentDidMount() {
    const { acSetCarts, acSetDropdownCarts, context } = this.props;

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
    carts = carts.filter(c => c.products.length > 0);
    acSetCarts(carts);

    const cartDefault = carts.find(car => car.isDefault);
    if (cartDefault) {
      acSetDropdownCarts({
        current: cartDefault,
        isVisible: false
      });
    }

    const tabelasDePreco = await SrvProduct.getPriceList();
    const tabelaFormatada = tabelasDePreco.map(item => { return { option: item.name, key: item.code }; });
    this.props.acSetPopUpFilter('dropTabelaDePreco', tabelaFormatada);

    this._isFirstMount = false;
  }

  render() {
    const background = this.props.context === 'Vendedor' ? backgroundVendor : backgroundAdmin;
    return (
      <ImageBackground source={background} style={stylesLocal.content} resizeMode="cover">
        {/* Body */}
        <View style={{ flex: 1 }}>
          <View style={stylesLocal.body}>
            {this._renderList()}
          </View>

          <ModalMask
            container={StyleSheet.absoluteFill}
            visible={this.props.modalMask}
            toggleModal={[
              { func: this.props.acToggleMask },
              { func: this.props.acResetButtonsCarts, params: [] },
            ]}
          />
          {/* Header */}
          <TranslucidHeader
            startingHeight={100}
            content={stylesLocal.header}
            y={this.state.listHeight}
          >
            {this._renderHeader()}
          </TranslucidHeader>
        </View>
        { /* PopUp Sort */}
        <SortPopUp
          isVisible={this.props.buttons[0].isChosen}
          sortName={this.sortName}
          {...this.props}
          orderList={this.orderList}
        />
        {/* PopUp Filtro */}
        <Panel
          {...this.props.panel}
          pointerActiveContent={this.props.panelPointer}
          togglePop={() => {
            this.props.acTogglePanel();
            this.props.acToggleMask();
          }}
        >
          <FilterPopUp
            isVisible
            SrvClients={SrvClients}
            {...this.props}
          />
        </Panel>
      </ImageBackground>
    );
  }

  _renderHeader() {
    const {
      buttons,
      list,
      acUpdateComponent,
    } = this.props;
    const container = !list ? { height: 70 } : null;

    return (
      <View style={container}>
        <Row style={{ width: '100%' }}>
          <Title style={stylesLocal.title} msg="CARRINHOS" />
          {
            this.props.context === 'Vendedor' &&
            <View style={{ flex: 1, paddingLeft: 10, paddingTop: 20, }}>
              <Text data-id="boxTituloCliente" style={[global.titleNomeCliente, { marginTop: 6 }]}>
                {this.props.client.fantasyName !== undefined ? this.props.client.fantasyName : ''}
                <Text style={global.codigoCliente}>{this.props.client.code === '' ? '' : `(${this.props.client.code})`}</Text>
              </Text>
              <Text style={global.setorCliente}>
                {this.props.client.sector}
              </Text>
            </View>
          }


          <View style={{ flexGrow: 1 }} />

          <DisableComponent isDisabled={this.props.carts.length === 0}>
            <Fade visible={this.props.listType} style={vwOrderBy}>
              <Button
                txtStyle={icOrderBy}
                txtMsg="k"
                isChosen={buttons[0].isChosen}
                shadow
                changeColor
                chosenColor="#0085B2"
                nChosenColor="rgba(0,0,0,.3)"
                rdAction={acUpdateComponent}
                rdName="sortPopUp"
                rdType="popup"
                actions={[{ func: this.btnMenuClicked, params: [0] }]}
              />
            </Fade>
            <Button
              tchbStyle={tchbFilter}
              txtStyle={stylesLocal.icFilter}
              txtMsg="l"
              isChosen={buttons[1].isChosen}
              shadow
              changeColor
              chosenColor="#0085B2"
              nChosenColor="rgba(0,0,0,.3)"
              action={() => {
                this.props.acToggleMask();
                this.props.acSetPanel(0);
                this.props.acTogglePanel();
              }}
            />
          </DisableComponent>
          <ModalMask
            container={StyleSheet.absoluteFill}
            visible={this.props.modalMask}
            toggleModal={[
              { func: this.props.acToggleMask, params: [] },
              { func: this.props.acResetButtonsCarts, params: [] },
            ]}
          />
        </Row>
        <DisableComponent isDisabled={this.props.carts.length === 0}>
          <BtnToggleList
            isActive={this.props.listType}
            action={() => {
              this.props.acToggleListCarts();
              if (this.props.modalMask) this.props.acToggleMask();
              if (this.props.buttons[0].isChosen) {
                this.props.acUpdateComponent('popup', 'sortPopUp');
                this.btnMenuClicked(0);
              }
            }}
            containerStyle={{
              marginRight: 40,
              marginTop: 5,
            }}
          />
        </DisableComponent>
      </View>
    );
  }

  _renderList() {
    if (this.props.carts.length === 0 && this._isFirstMount) {
      return (
        <InfoMsg
          firstMsgBold
          icon="p"
          firstMsg={['A página de', 'carrinhos', 'está vazia.']}
          sndMsg="Partiu visitar clientes?"
        />
      );
    }

    if (!this.props.listType) {
      return (
        <TableList
          setListHeight={this.setListHeight}
          loadMore={() => { }}
          data={this.props.carts}
          sort={this.props.sort}
          header={(props) => <HeaderTL {...props} />}
          row={(item, index, props) => <RowTL item={item} {...props} />}
          orderList={this.orderList}
          navigation={this.props.navigation}
          appDevName={this.props.appDevName}
          containerStyle={{ marginTop: 108 }}
          acSetDropdownCarts={this.props.acSetDropdownCarts}
          acSetCurrentClient={this.props.acSetCurrentClient}
          acToggleSortCarts={this.props.acToggleSortCarts}
        />
      );
    }

    return (
      <View style={{ height: '100%' }}>
        <SummaryList
          setListHeight={this.setListHeight}
          loadMore={() => console.log('load more...')}
          {...this.props}
          data={this.props.carts}
          acCurrentProduct={this.props.acCurrentProduct}
        />
      </View>
    );
  }

  setListHeight(y) {
    this.setState({ listHeight: new Animated.Value(y) });
  }

  btnMenuClicked() {
    // Se o modal atual for desativado, tira a máscara
    const isAnyModalOpen = anyIsSelected(this.props.buttons, 'isChosen');
    // Se um modal estiver ativo, precisa manter a máscara ativa
    if (isAnyModalOpen === undefined) {
      this.props.acToggleMask();
    } else if (!this.props.modalMask) {
      // Se a máscara não estiver ativa, ativaremos ela qando o modal abrir
      this.props.acToggleMask();
    }
  }

  toggleIsQuering = () => {
    this.setState({ isQuering: this.state.isQuering === 'auto' ? 'none' : 'auto' });
  }

  clearPanelFilters = () => {
    const hasFilters = this.props.popUpFilter.find(({ current }) => current !== '');
    if (!hasFilters) {
      setTimeout(() => {
        this.props.acClearPanelFilters();
      }, 550);
    }
  }

  sortName = async () => {
    SrvClients.get(this.props.acSetClients, ['sf_name']);
  }

  orderList = async (orderBy, isDesc) => {
    const { context, acSetCarts, acSetDropdownCarts, } = this.props;

    let carts = [];
    if (context === 'Admin') {
      carts = await SrvOrder.getCarrinhos([], orderBy, isDesc);
    } else if (context === 'Vendedor') {
      const filtro = [{ sf_account_id: this.props.client.sf_id }];
      carts = await SrvOrder.getCarrinhos(filtro, orderBy, isDesc);
    }

    await asyncForEach(carts, async (car) => {
      car.products = await SrvOrder
        .getProdutos(
          [{ order_sfa_guid__c: car.key }],
          { fields: ['sf_segmento_negocio__c'] }
        );
    });
    carts = carts.filter(c => c.products.length > 0);
    acSetCarts(carts);

    const cartDefault = carts.find(car => car.isDefault);
    if (cartDefault) {
      acSetDropdownCarts({
        current: cartDefault,
        isVisible: false
      });
    }
  }
}
const mapStateToProps = state => ({
  buttons: state.carts.buttons,
  sort: state.carts.sort,
  popUpFilter: state.clients.popUpFilter,
  panelFilter: state.clients.panelFilter,
  list: state.clients.list,
  panel: state.clients.panel,
  panelPointer: state.clients.panelPointer,
  data: state.clients.data,
  client: state.assistant.client,
  isResultFinder: state.clients.isResultFinder,
  context: state.global.context,
  window: state.global.window,
  modalMask: state.global.modalMask,
  carts: state.catalog.carts,
  dropdown: state.catalog.dropdown,
  listType: state.carts.listType,
  currentTable: state.assistant.currentTable,
  appDevName: state.global.appDevName,
});

export default connect(mapStateToProps,
  {
    ...reducersClients,
    ...cartsActions,
    acToggleMask,
    acCloseSubMenus,
    acSetCarts,
    acSetDropdownCarts,
    acCurrentProduct,
    acSetCurrentClient,
  })(Carrinhos);

const icOrderBy = {
  fontFamily: Font.C,
  fontSize: 32,
  color: 'rgba(102, 102, 102, 0.5)',
  zIndex: 2,
};
const vwOrderBy = {
  marginTop: 30,
  marginRight: 10,
  zIndex: 2,
};
const tchbFilter = {
  marginTop: 30,
  marginRight: 32,
  zIndex: 2,
};

let stylesLocal = StyleSheet.create({
  title: {
    fontFamily: Font.AThin,
    marginLeft: 30,
    marginTop: 20,
    fontSize: 42,
    color: 'rgba(102, 102, 102, 0.5)',
  },
  content: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
  },
  row: {
    flexDirection: 'row',
  },
  icFilter: {
    fontFamily: Font.C,
    fontSize: 32,
    color: 'rgba(102, 102, 102, 0.5)',
  },
  body: {
    flex: 1,
  },
  vwFPU: {
    position: 'absolute',
    marginTop: 65,
    width: 964,
    height: 350,
    ...Platform.select({
      web: {
        right: -54,
      }
    }),
  },
  vwSPU: {
    width: 964,
    height: 350,
  },
});

const RowTL = (props) => {
  const { item } = props;

  return (
    <TouchableOpacity
      onPress={async () => {
        // debugger
        await cartBoxClicked(props.data, item.key, props.acSetDropdownCarts, props.acSetCurrentClient, props.appDevName);
        props.navigation.navigate('carrinho', { BackSpace: true, wasInCarts: true });
      }}
      style={{ flexDirection: 'row', alignItems: 'center', height: 40, width: '100%' }}
    >
      <View style={global.containerCenter}>
        <TextLimit
          msg={item.name.toUpperCase()}
          style={[global.txtColumn, { color: '#535456', fontFamily: Font.ASemiBold }]}
          maxLength={11}
        />
      </View>
      <View style={global.containerCenter}>
        {/* SETOR DO CLIENTE */}
        <TextLimit
          msg=""
          style={global.txtColumn}
          maxLength={11}
        />
      </View>
      {/* <View style={global.containerCenter}> */}
      {/* ID DO PEDIDO */}
      {/* MAX LENGTH E PROPEIDADE TEMPORÁRIA */}
      {/* <TextLimit */}
      {/* msg={item.key} */}
      {/* style={global.txtColumn} */}
      {/* maxLength={8} */}
      {/* /> */}
      {/* </View> */}
      <View style={global.containerCenter}>
        {/* STATUS DO PEDIDO */}
        <TextLimit
          msg=""
          style={global.txtColumn}
          maxLength={11}
        />
      </View>
      <View style={global.containerCenter}>
        {/* DT.STATUS DO PEDIDO */}
        <TextLimit
          msg=""
          style={global.txtColumn}
          maxLength={11}
        />
      </View>
      <View style={global.containerCenter}>
        {/* VALOR TOTAL DO PEDIDO */}
        <Price
          style={global.txtColumn}
          price={item.totalAmount}
        />
      </View>
    </TouchableOpacity>
  );
};

const HeaderTL = ({ sort, acToggleSortCarts, orderList }) => {
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SortBy
        hasArrows
        isActive={sort[0].isChosen}
        isUp={sort[0].order}
        type="NOME"
        toggle={() => {
          acToggleSortCarts(sort[0].name);
          orderList(['sfa_nome_carrinho'], !sort[0].order);
        }}
        containerStyle={global.containerCenter}
        txtStyle={global.txtColumn}
      />
      <SortBy
        hasArrows
        isActive={sort[1].isChosen}
        isUp={sort[1].order}
        type="SETOR"
        toggle={() => {
          acToggleSortCarts(sort[1].name);
          // orderList(['sf_sector'], sort[1].order);
        }}
        containerStyle={global.containerCenter}
        txtStyle={global.txtColumn}
      />
      {/* <SortBy
        hasArrows
        isActive={sort[2].isChosen}
        isUp={sort[2].order}
        type="PEDIDO"
        toggle={() => {
          acToggleSortCarts(sort[2].name);
          orderList(['id'], !sort[2].order);
        }}
        containerStyle={global.containerCenter}
        txtStyle={global.txtColumn}
      /> */}
      <SortBy
        hasArrows
        isActive={sort[3].isChosen}
        isUp={sort[3].order}
        type="STATUS"
        toggle={() => {
          acToggleSortCarts(sort[3].name);
          // orderList(['sf_status'], sort[3].order);
        }}
        containerStyle={global.containerCenter}
        txtStyle={global.txtColumn}
      />
      <SortBy
        hasArrows
        isActive={sort[4].isChosen}
        isUp={sort[4].order}
        type="DT.STATUS"
        toggle={() => {
          acToggleSortCarts(sort[4].name);
          // orderList(['sf_dt_status'], sort[4].order);
        }}
        containerStyle={global.containerCenter}
        txtStyle={global.txtColumn}
      />
      <SortBy
        hasArrows
        isActive={sort[5].isChosen}
        isUp={sort[5].order}
        type="VALOR"
        toggle={() => {
          acToggleSortCarts(sort[5].name);
          orderList(['sf_total_amount'], !sort[5].order);
        }}
        containerStyle={global.containerCenter}
        txtStyle={global.txtColumn}
      />
    </View>
  );
};