import { LinearGradient } from 'expo-linear-gradient'
import React from 'react';
import { Platform, View, Text, ImageBackground, AsyncStorage, Image } from 'react-native';
import { connect } from 'react-redux';
import { NavigationActions } from 'react-navigation';
import { backgroundVendor, backgroundAdmin } from '../../assets/images';
import { acNextStep, acNextScreen, changePorcent, changeIndeterminate, acResetPage, changeRetry, } from '../../redux/actions/pages/setup';
import { acUpdateContext } from '../../redux/actions/global';
import { Conclusion, FirstSetup, Steps, Media } from '../../components';
import styles from '../../assets/styles/global';
import { onSync } from '../../services/SyncDb';
import deviceInfo from '../../services/DeviceInfo';
import { getUserId, getAppId } from '../../services/Auth';

class Setup extends React.Component {
  constructor(props) {
    super(props);
    this.state = { statusDownload: null, client: {} };
    // this.props.acNextStep = this.props.acNextStep.bind(this);
    // this.props.changePorcent = this.props.changePorcent.bind(this);
    // this.props.changeIndeterminate = this.props.changeIndeterminate.bind(this);
    // this.props.changeRetry = this.props.changeRetry.bind(this);
    this.isDbDownloaded = this.isDbDownloaded.bind(this);
    this.areDbsComplete = this.areDbsComplete.bind(this);
  }

  async componentDidMount() {
    const {
      changePorcent,
      changeIndeterminate, changeRetry } = this.props;


    // REGISTRANDO DEVICE COM EXCEÇÃO DO ANDROID.
    let deviceId,
      userId,
      appId;
    deviceId = await deviceInfo.getDeviceId();
    deviceId = deviceId || await deviceInfo.registerDevice();
    userId = await getUserId();
    appId = await getAppId();

    onSync({ service: 'account', changePorcent, changeIndeterminate, changeRetry, deviceId, userId, appId });
    onSync({ service: 'product', changePorcent, changeIndeterminate, changeRetry, deviceId, userId, appId });
    onSync({ service: 'setup', changePorcent, changeIndeterminate, changeRetry, deviceId, userId, appId });
    onSync({ service: 'order', changePorcent, changeIndeterminate, changeRetry, deviceId, userId, appId });
  }

  async componentWillMount() {
    if (this.state.client !== {}) {
      let client = null;
      let appDevName = null;
      if (Platform.OS === 'web') {
        client = JSON.parse(window.localStorage.clientInfo);
      } else {
        client = JSON.parse(await AsyncStorage.getItem('clientInfo'));
      }
      this.setState({ client });
    }
  }

  componentWillUnmount() {
    this.props.acResetPage();
  }

  render() {
    const {
      steps, screen, context,
      iProgressBar,
      indeterminate, acUpdateContext,
      navigation, acNextStep, retry,
      changePorcent,
      changeIndeterminate,
      changeRetry,
    } = this.props;
    const StepsSetup = [
      { id: 0, txtStyle: styles.step1, txtStep: 'Dados Básicos' },
      { id: 1, txtStyle: styles.step, txtStep: 'Mídias' },
      { id: 2, txtStyle: styles.step, txtStep: 'Conclusão' }
    ];
    const background = context === 'Vendedor' ? backgroundVendor : backgroundAdmin;

    if (this.state.client !== {}) {
      return (
        <ImageBackground source={background} style={styles.container} resizeMode="cover">
          <View style={{ height: 160 }}>
            <Text style={styles.titlePagina}>INÍCIO</Text>
            <Text style={[styles.sub_title_1, { paddingTop: 20 }]}>
              Olá
              <Text style={styles.bold}>
                {` ${this.state.client.Name}`}
              </Text>
              , seja bem-vindo(a)!
            </Text>
            {/* <Image style={{ height: 100, width: 100, backgroundColor: 'grey' }} source={{ uri: this.state.client.FullPhotoUrl }} resizeMode="contain" /> */}
          </View>
          <View style={styles.body}>
            <View style={styles.headerBody}>
              {
                Platform.OS === 'web'
                  ?
                    <View
                      colors={['rgba(0,133,178, 0.1)', 'rgba(0,133,178, 0)']}
                      style={styles.linearGradient}
                      data-id="lineargradient-setup"
                    >
                      <Steps
                        vwSteps={{ flexDirection: 'row', marginTop: 15 }}
                        steps={steps}
                        componentValues={StepsSetup}
                      />
                    </View>
                  :
                    <LinearGradient colors={['rgba(0,133,178, 0.1)', 'rgba(0,133,178, 0)']} style={styles.linearGradient}>
                      <Steps
                        vwSteps={{ flexDirection: 'row', marginTop: 15 }}
                        steps={steps}
                        componentValues={StepsSetup}
                      />
                    </LinearGradient>
              }
            </View>
            <View style={styles.bodyBody}>
              <View>
                {
                  [
                    <FirstSetup
                      nextStep={acNextStep}
                      iProgressBar={iProgressBar}
                      indeterminate={indeterminate}
                      retry={retry}
                      changePorcent={changePorcent}
                      changeIndeterminate={changeIndeterminate}
                      changeRetry={changeRetry}
                    />,
                    <Media
                      onSync={onSync}
                      changePorcent={changePorcent}
                      changeIndeterminate={this.props.changeIndeterminate}
                      changeRetry={changeRetry}
                      retry={retry}
                      nextStep={acNextStep}
                      iProgressBar={iProgressBar}
                      indeterminate={indeterminate}
                      actions={[
                        {
                          func: this.isDbDownloaded,
                          params: [true]
                        },
                        {
                          func: this.props.acUpdateContext,
                          params: ['Admin']
                        },
                      ]}
                    />,
                    <Conclusion
                      actions={[
                        {
                          func: this.isDbDownloaded,
                          params: [true]
                        },
                        {
                          func: this.props.acUpdateContext,
                          params: ['Admin']
                        },
                      ]}
                    />
                  ][screen]
                }
              </View>
            </View>
          </View>
        </ImageBackground>
      );
    }
    return (<View />);
  }

  async areDbsComplete(onlyResources, deviceId) {
    let isDbLocal = false;
    if (Platform.OS === 'web') {
      const isDbAccount = window.webSqlManager.exists('sfa-account', 'userId');
      const isDbProduct = window.webSqlManager.exists('sfa-product', 'userId');
      const isDbSetup = window.webSqlManager.exists('sfa-setup', 'userId');
      const isDbResource = window.webSqlManager.exists('sfa-resource', 'userId');
      if (onlyResources) isDbLocal = isDbAccount;
    } else {
      deviceId = await deviceInfo.getDeviceId();
      const isDbProduct = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}SQLite/${deviceId}_sfa-product.db`);
      const isDbSetup = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}SQLite/${deviceId}_sfa-setup.db`);
      const isDbResource = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}SQLite/${deviceId}_sfa-resource.db`);
      const isDbAccount = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}SQLite/${deviceId}_sfa-account.db`);

      isDbLocal = isDbAccount.exists // && isDbProduct.exists
        && isDbResource.exists; // && isDbSetup.exists;
    }
    return isDbLocal;
  }

  async isDbDownloaded(conclusion) {
    const { navigation } = this.props;
    const resetAction = NavigationActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName: 'assistant' })],
    });
    if (conclusion) {
      navigation.dispatch(resetAction);
    }

    const deviceId = await deviceInfo.getDeviceId();

    const isDbLocal = await this.areDbsComplete(true, deviceId);
    if (isDbLocal) {
      acUpdateContext('Admin');
      navigation.dispatch(resetAction);
    }
  }
}

const mapStateToProps = state => ({
  steps: state.setup.steps,
  screen: state.setup.screen,
  iProgressBar: state.setup.iProgressBar,
  indeterminate: state.setup.indeterminate,
  redirects: state.menu.redirects,
  context: state.global.context,
  retry: state.setup.retry,
}
);

export default connect(mapStateToProps, {
  acNextStep,
  acNextScreen, 
  changePorcent,
  changeIndeterminate,
  acUpdateContext,
  acResetPage,
  changeRetry,
})(Setup);
