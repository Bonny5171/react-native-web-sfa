import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SimpleButton, CheckBox } from '../../../components';
import { CheckOption } from '.';
import { Font } from '../../../assets/fonts/font_names';
import global from '../../../assets/styles/global';
import SrvAccount from '../../../services/Account';
import InfoMsg from '../../../components/InfoMsg/InfoMsg';

const height = 50;
const width = 90;
const widthColl1 = 50;

const coll = {
  flex: 1,
  flexDirection: 'column',
  marginRight: 55,
};
const row = {
  flexDirection: 'row',
  justifyContent: 'center',
  alignContent: 'center',
  width: (2 * width) + widthColl1,
};
const rowBorder = {
  ...row,
  borderBottomColor: 'rgba(0,0,0,.15)',
  borderBottomWidth: 1,
};
const cell = {
  justifyContent: 'center',
  alignItems: 'center',
  alignContent: 'center',
  width
};
const cell1 = {
  ...cell,
  width: widthColl1
};

// ==== para fake ====
const linha = {
  flexDirection: 'row',
  justifyContent: 'center',
  alignContent: 'center',
  paddingVertical: 3,
};
const bordaLinha = {
  ...linha,
  borderBottomColor: 'rgba(0,0,0,.15)',
  borderBottomWidth: 1,
};
const celula = {
  // justifyContent: 'center', 
  alignItems: 'center', 
  alignContent: 'center',
  flexDirection: 'row',
}

class DefineDiscounts extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      checks : [[false,false],[false,false],[false,false],[false,false]]
    }
  }

  // async componentDidMount() {
  //   if (this.props.discountCheckboxes.length === 0) {
  //   const lista = await SrvAccount.getDiscount(this.props.client.sf_id);
  //   const discountCheckboxes = lista.map(value => {
  //     return {
  //       name: value.sf_name,
  //       dicount: value.sf_desconto__c,
  //       term: value.sf_prazo__c,
  //       msg: 'Desconto aaaa ssdf qwersadd qwerasdf qfgh sdfgz',
  //       isChosen: false
  //     };
  //   });
  //   this.props.acSetDiscountCheckBoxes({ discountCheckboxes });
  // }
  // }

  // render() {
  //   const { acUpdateContext, navigation, discountCheckboxes, acCheckDiscount } = this.props;
  //   const firstColumn = [];

  //   discountCheckboxes.map((d, index) => {
  //     firstColumn.push(
  //       (
  //         <Option
  //           key={index.toString()}
  //           index={index}
  //           opt={d}
  //           lastDiscount={discountCheckboxes.length - 1}
  //           acCheckDiscount={this.props.acCheckDiscount}
  //         />
  //       )
  //     );
  //   });
  //   return (
  //     <View data-id="aba-desc-ctn-cols" style={[global.flexOne, { flexDirection: 'row', flexWrap: 'wrap' }]}>
  //       <View style={{ flexDirection: 'row',  flexGrow: 1, }}>
  //         {
  //           firstColumn.length > 0
  //             ? <View style={coll}>
  //                <View style={[row, { alignItems: 'flex-end' }]}>
  //                 <View style={cell1}>
  //                   <Text>{}</Text>
  //                 </View>
  //                 <View style={cell}>
  //                   <Text>DESCONTOS</Text>
  //                 </View>
  //                 <View style={cell}>
  //                   <Text>PRAZOS</Text>
  //                 </View>
  //               </View>
  //               {firstColumn}
  //               </View>
  //             : (
  //               <InfoMsg
  //                 icon="C"
  //                 firstMsg="Este cliente não possui descontos."
  //                 sndMsg="Se desejar, pode começar as suas vendas!"
  //                 containerStyle={{ justifyContent: null }}
  //               />
  //             )
  //         }

  //       </View>
  //       <View style={{ paddingRight: 75, flexGrow: 1 }}>
  //         <SimpleButton
  //           tchbStyle={{ alignSelf: 'flex-end', marginTop: 16 }}
  //           msg="IR PARA O CATÁLOGO"
  //           action={() => {
  //               navigation.replace('catalog', { isShowCase: this.props.checkboxes[1] });
  //               acUpdateContext('Vendedor');
  //           }}
  //         />
  //       </View>
  //     </View>
  //   );
  // }

  // ==== para fake ====
  toggleCheck(index,col){
    const upChecks = this.state.checks;
    upChecks[index][col] = !upChecks[index][col];
    this.setState({checks: upChecks});
  }
  // ==== para fake ====
  renderLinhasFakes(){
    const linhas = [
      {segmento:'Grendene Kids', desconto:null, prazo:'120 dias',},
      {segmento:'Masculino', desconto:'5%', prazo:'120 dias',},
      {segmento:'Feminino', desconto:null, prazo:'150 dias',},
      {segmento:'Ipanema', desconto:null, prazo:'120 dias',},
    ]

    return linhas.map((item,index) => (
      <View key={index.toString()}
        style={[index === linhas.length-1 ? linha : bordaLinha]}
      >
        <View style={[celula, {flex:6}]}>
          <Text style={[global.text, styles.checkStep4]}>{item.segmento}</Text>
        </View>
        <View style={[celula, {flex:4}]}>
        {item.prazo !== null ? 
          <TouchableOpacity disabled={false} onPress={() => this.toggleCheck(index,0)} style={{flexDirection:'row', alignItems:'center'}}>
            <CheckBox
              disabled={false}
              radio={false}
              isChosen={this.state.checks[index][0]}
              action={() => this.toggleCheck(index,0)}
            />
            <Text style={[global.text, {paddingLeft:8}]}>{item.prazo}</Text>
          </TouchableOpacity>
          :
          <Text style={[global.text, styles.checkStep4]}>-</Text>
        }
        </View>
        <View style={[celula, {flex:3}]}>
          {item.desconto !== null ? 
          <TouchableOpacity disabled={false} onPress={() => this.toggleCheck(index,1)} style={{flexDirection:'row', alignItems:'center'}}>
            <CheckBox
              disabled={false}
              radio={false}
              isChosen={this.state.checks[index][1]}
              action={() => this.toggleCheck(index,1)}
            />
            <Text style={[global.text, {paddingLeft:8}]}>{item.desconto}</Text>
          </TouchableOpacity>
          :
          <Text style={[global.text, styles.checkStep4]}>-</Text>
          }
        </View>
      </View>
    ))
  }
  // ==== para fake ====
  render(){
    const { acUpdateContext, navigation, discountCheckboxes } = this.props;
    return (
      <View data-id="aba-desc-ctn-cols" style={[global.flexOne, {flexDirection:'row'}]}>
        <View style={{width:'60%'}}>
          <View style={linha}>
            <View style={[celula, {flex:6}]}>
              <Text style={styles.cabecalho}>DESCRIÇÃO</Text>
            </View>
            <View style={[celula, {flex:4}]}>
              <Text style={styles.cabecalho}>PRAZOS</Text>
            </View>
            <View style={[celula, {flex:3}]}>
              <Text style={styles.cabecalho}>DESCONTOS</Text>
            </View>
          </View>
          {this.renderLinhasFakes()}
        </View>
        <View style={{ paddingRight: 75, flexGrow: 1 }}>
          <SimpleButton
            tchbStyle={{ alignSelf: 'flex-end', marginTop: 16 }}
            msg="IR PARA O CATÁLOGO"
            action={() => {
                navigation.replace('catalog', { isShowCase: this.props.checkboxes[1] });
                acUpdateContext('Vendedor');
            }}
          />
        </View>
      </View>
    )
  }
}

export default DefineDiscounts;

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontFamily: Font.AMedium,
    marginBottom: 8
  },
  checkStep4: {
    fontSize: 16,
    fontFamily: Font.ARegular,
    alignSelf: 'center',
  },
  // ==== para fake ====
  cabecalho: {
    fontSize: 14,
    fontFamily: Font.ASemiBold,
  },
});


export const Option =  ({ opt, index, lastDiscount, acCheckDiscount }) => {
  const desconto = opt.dicount ? `${opt.dicount}%` : ' -';
  const prazo = opt.term ? `${opt.term}` : ' - ';
  return (
    <TouchableOpacity
      style={[index === lastDiscount ? row : rowBorder]}
      disabled={false}
      onPress={() => acCheckDiscount(index)}
    >
      <View style={cell1}>
        <CheckBox
          disabled={false}
          radio={false}
          isChosen={opt.isChosen}
          action={() => acCheckDiscount(index)}
        />
      </View>
      <View style={cell}>
        <Text style={[global.text, styles.checkStep4]}>{desconto}</Text>
      </View>
      <View style={cell}>
        <Text style={[global.text, styles.checkStep4]}>{prazo}</Text>
      </View>
    </TouchableOpacity>
  );
};