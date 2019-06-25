import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { IconActionless, TextLimit } from '../../../../../components';
import global from '../../../../../assets/styles/global';
import { Font } from '../../../../../assets/fonts/font_names';
import SrvOrder from '../../../../../services/Order/';
import { agrupaProdutosNoCarrinho, atualizaCarrinhoAtual } from '../../../../../utils/CommonFns';
import { acSetCarts, acSetDropdownCarts } from '../../../../../redux/actions/pages/catalog';

class Cart extends React.PureComponent {
  render() {
    const {
      item, index, togglePop, acSelectCart, acDeleteCart, acSetCarts,
      client, acSetDropdownCarts, currentTable,
    } = this.props;
    const produtos = agrupaProdutosNoCarrinho(item.products);
    if (item.isChosen) {
      return (
        <View style={[styles.container, styles.rowVSpacing]}>
          <TouchableOpacity
            disabled
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => {
              togglePop();
              acSelectCart(item, index);
            }}
          >
            <IconActionless msg="p" style={styles.icCurrent} />
            <TextLimit
              style={[global.currentHighlight, { marginLeft: 3, color: 'rgba(0, 0, 0, 0.8)', textDecorationLine: null }]}
              msg={item.name}
              maxLength={18}
            />
          </TouchableOpacity>
          <Action
            isDefault={item.isDefault}
            name={item.name}
            qt={produtos.length}
            acDeleteCart={acDeleteCart}
            acSetCarts={acSetCarts}
            client={client}
            item={item}
            acSetDropdownCarts={acSetDropdownCarts}
            currentTable={currentTable}
          />
        </View>
      );
    }

    return (
      <View style={[styles.container, styles.rowVSpacing]}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center' }}
          onPress={async () => {
            if (togglePop) togglePop();
            acSelectCart(item.name, index);
            const filtro = [
              { sf_account_id: client.sf_id },
              { sf_pricebook2id: currentTable.code },
            ];
            await SrvOrder.resetCarrinhoPadrao(filtro);
            await SrvOrder.updateCarrnho({ id: item.key, sfa_carrinho_selecionado: 'true', });
            atualizaCarrinhoAtual({ client, currentTable, acSetCarts, acSetDropdownCarts, });
          }}
        >
          <View style={{ height: 20, width: 17 }} />
          <TextLimit
            style={[global.currentHighlight, { marginLeft: 3, fontFamily: Font.AMedium, }]}
            msg={item.name}
            maxLength={18}
          />
        </TouchableOpacity>
        <Action
          isDefault={item.isDefault}
          name={item.name}
          qt={produtos.length}
          client={client}
          item={item}
          acDeleteCart={acDeleteCart}
          acSetCarts={acSetCarts}
          acSetDropdownCarts={acSetDropdownCarts}
          currentTable={currentTable}
        />
      </View>
    );
  }
}

const mapStateToProps = (state) => ({
  currentTable: state.assistant.currentTable,
});

const mapDispatchToProps = {
  acSetCarts,
  acSetDropdownCarts,
};

export default connect(mapStateToProps, mapDispatchToProps)(Cart);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
  },
  rowVSpacing: {
    paddingVertical: 5.2
  },
  icDelete: {
    fontFamily: Font.C,
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 22,
  },
  tchbDelete: {
    marginTop: -2
  },
  icCurrent: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.8)',
  },
  txt: {
    fontFamily: Font.AMedium,
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
    // marginTop: -6,
    marginRight: 2
  },
  actionContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    right: 0,
  }
});

const Action = ({ isDefault, qt, item, acSetCarts, client, acSetDropdownCarts, currentTable }) => {
  if (isDefault) {
    return (
      <View style={styles.actionContainer}>
        <Text style={styles.txt}>({qt})</Text>
        <View style={{ height: 22, width: 27.5 }} />
      </View>
    );
  }
  return (
    <View style={styles.actionContainer}>
      <Text style={styles.txt}>({qt})</Text>
      <TouchableOpacity
        onPress={async () => {
          SrvOrder.removeCarrinho(item.key);
          atualizaCarrinhoAtual({ client, currentTable, acSetCarts, acSetDropdownCarts, });
        }}
      >
        <Text style={styles.icDelete}>w</Text>
      </TouchableOpacity>
    </View>
  );
};