import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationActions } from 'react-navigation';
import { connect } from 'react-redux';
import global from '../../../assets/styles/global';
import { Font } from '../../../assets/fonts/font_names';
import { Row, Button, PopUp, SortArrows, SortBy, ModalMask, DisableComponent, DropTable, CurrentBtn } from '../../../components';
import { acAssistant, acSortCurrCartBy } from '../../../redux/actions/pages/catalog';
import { CurrentCart } from '../../Catalog/components/FastSelection/common';
import { acSetPanel, acTogglePanel, acToggleMenuBtn, acToggleSortBtn, acResetPopCart } from '../../../redux/actions/pages/cart';
import { acToggleMask } from '../../../redux/actions/global';
import { resetNavigate } from '../../../utils/routing/Functions';

const HEADER_HEIGHT = 116;

class Head extends React.Component {
  render() {
    const { menuButtons, sortButtons } = this.props;
    if (!this.props.dropdown.current.name) {
      console.log('Verificar estado da store "this.props.dropdown.current"');
    }
    let name = '';
    if (this.props.dropdown.current && this.props.dropdown.current.name) {
      name = this.props.dropdown.current.name.length > 40 ? `${this.props.dropdown.current.name.substr(0, 40)}...` : this.props.dropdown.current.name;
    }
    return (
      <View
        style={styles.container}
      >
        <Row>
          <Row style={styles.headerContent}>
            <Button
              txtStyle={styles.icReturn}
              pop={this.props.navigation.getParam('BackSpace', '')}
              navigation={this.props.navigation}
              action={this.return}
              txtMsg="v"
            />
            <View style={{ marginLeft: 5 }}>
              <Text style={[global.titlePagina, styles.txtTitle]}>CARRINHO </Text>
            </View>
            <View style={styles.vwTitle}>
              <Text data-id="boxTituloCliente" style={[global.titleNomeCliente, { marginTop: 6 }]}>
                {this.props.client.fantasyName !== undefined ? this.props.client.fantasyName : ''}
                {this.props.client.code && (
                  <Text style={[global.codigoCliente, { marginTop: 12 }]}>
                    {this.props.client.code !== '' ? ` (${this.props.client.code})` : ''}
                  </Text>
                )}
              </Text>
              <Text style={global.setorCliente}>
                {this.props.client.sector}
              </Text>
            </View>
          </Row>
          <View style={styles.vwButtons}>
            <Button
              txtStyle={global.menuIcon}
              tchbStyle={{ height: 32 }}
              txtMsg="k"
              isChosen={menuButtons[0]}
              action={() => {
              this.props.acToggleMenuBtn(0);
              this.props.acToggleMask();
            }}
              shadow
              changeColor
              chosenColor="#0085B2"
              nChosenColor="rgba(0, 0, 0, 0.3)"
            />
            <DisableComponent
              isDisabled={this.props.isOrderReady}
            >
              <Button
                txtStyle={global.menuIcon}
                tchbStyle={{ height: 41 }}
                txtMsg="q"
                isChosen={menuButtons[1]}
                action={() => {
                  this.props.acSetPanel(4);
                  this.props.acTogglePanel();
                  this.props.acToggleMask();
                }}
                shadow
                changeColor
                chosenColor="#0085B2"
                nChosenColor="rgba(0, 0, 0, 0.3)"
              />
            </DisableComponent>
          </View>
        </Row>
        <Row style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', width: '100%', paddingRight: 29 }}>
          <CurrentBtn
            isDisabled={this.props.wasInCarts}
            icon={'"'}
            current={`${name} (${this.props.products.length})`}
            onIconClick={this.openCartPanel}
            containerStyle={{ alignSelf: 'flex-start' }}
          />
          <CurrentBtn
            isDisabled
            isUpper
            current={this.props.currentTable.name}
            maxLength={30}
            icon="/"
            onIconClick={() => {}}
            containerStyle={{ marginRight: 7 }}
          />
        </Row>
        <ModalMask
          visible={this.props.modalMask}
          toggleModal={[
            { func: this.props.acToggleMask, params: [] },
            { func: this.props.acResetPopCart, params: [] },
          ]}
        />
        <PopUp
          isVisible={menuButtons[0]}
          containerStyle={styles.sortPop}
        >
          {
            sortButtons.map(({ id, label, isAscendant, isActive, prop }) => (
              <SortBy
                key={id}
                isUp={isAscendant}
                isActive={isActive}
                hasArrows
                type={label}
                toggle={() => this.sortBy(prop, id, isAscendant, isActive)}
                containerStyle={styles.vwSort}
              />
            ))
          }
        </PopUp>
      </View>
    );
  }

  return = () => {
    const route = this.props.wasInProduct ? 'product' : 'catalog';
    resetNavigate(route, this.props.navigation);
  }

  sortBy = async (prop, id) => {
    await this.props.acToggleSortBtn(id);
    this.props.acSortCurrCartBy(prop, this.props.sortButtons[id].isAscendant);
  }

  openCartPanel = () => {
    this.props.acSetPanel(7);
    this.props.acTogglePanel();
    this.props.acToggleMask();
  }
}
const mapStateToProps = (state) => ({
  menuButtons: state.cart.menuButtons,
  sortButtons: state.cart.sortButtons,
  dropdown: state.catalog.dropdown,
  modalMask: state.global.modalMask,
});

const mapDispatchToProps = {
  acAssistant,
  acSetPanel,
  acTogglePanel,
  acToggleMask,
  acToggleMenuBtn,
  acSortCurrCartBy,
  acToggleSortBtn,
  acResetPopCart,
};

export default connect(mapStateToProps, mapDispatchToProps)(Head);

const styles = StyleSheet.create(
  {
    container: {
      width: '100%',
      height: HEADER_HEIGHT,
      paddingTop: 20,
    },
    headerContent: {
      flex: 2,
      width: '100%',
    },
    client: {
      fontFamily: Font.BMedium,
      fontSize: 18,
      color: '#6C7073',
      marginTop: 2
    },
    cartName: {
      fontSize: 12,
      marginLeft: 5,
      opacity: 0.5,
      transform: [{ translateY: -6 }],
    },
    icReturn: {
      fontFamily: Font.C,
      fontSize: 30,
      marginTop: 13,
      marginLeft: 15,
      transform: [{ rotate: '180deg' }],
      color: 'rgba(102, 102, 102, 0.5)'
    },
    icHeader: {
      marginRight: 10,
    },
    sortPop: {
      right: 36,
      top: 73,
      justifyContent: 'center',
    },
    vwTitle: {
      flex: 1,
      paddingLeft: 10,
    },
    txtTitle: {
      marginLeft: 0,
      marginTop: 0,
    },
    vwButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 30,
    },
    vwSort: {
      marginLeft: 9
    },
  }
);