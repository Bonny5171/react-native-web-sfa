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
// import { onSync } from '../../services/SyncDb';
import deviceInfo from '../../services/DeviceInfo';
import { getUserId, getAppId, getToken, isDbLocal, } from '../../services/Auth';
import * as FileSystem from 'expo-file-system'
import { services } from '../../../config';

import Product from '../../services/Product';
import Account from '../../services/Account';
import SetupPage from '../../services/Setup';
import Resource from '../../services/Resource';
import Order from '../../services/Order';

const servicesInstance = {
  product: Product,
  account: Account,
  setup: SetupPage,
  order: Order,
  resource: Resource
};


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

  async onSync({ service, deviceId, userId, appId, }) {
    // const { changePorcent, changeIndeterminate, changeRetry } = this.props;
    
    console.log('changePorcent', this.props.changePorcent);
    console.log('changeIndeterminate', this.props.changeIndeterminate);
    console.log('changeRetry', this.props.changeRetry);

    console.log(`deviceId: ${deviceId}`);
    console.log(`userId: ${userId}`);
    console.log(`appId: ${appId}`);
  
    const hasFileSystemPath = async () => {
      // Valida se tem o local para salvar os bancos.
      const fileUri = `${FileSystem.documentDirectory}SQLite`;
      const pathStore = await FileSystem.getInfoAsync(fileUri, {});
  
      console.log('VALIDANDO SE TENHO O PATH PARA SALVAR O BANCO.', pathStore.exists);
      if (pathStore.exists !== 1) {
        console.log('Cria a pasta para salvar os bancos: ', fileUri);
  
        try {
          await FileSystem.makeDirectoryAsync(fileUri, {});
        } catch (error) {
          console.log('error', error);
        }
      }
    };
  
    const register = async (nome, cfg) => {
      servicesInstance[nome].saveParameter('CURRENT_DEVICE_ID', deviceId);
      servicesInstance[nome].saveParameter('CURRENT_USER_ID', userId);
      servicesInstance[nome].saveParameter('CURRENT_APP_ID', appId);
    };
  
    const processDownload_NATIVO = async (cfg, nome, url, options) => {
      tentativas++;
  
      console.log(`TENTATIVA "${tentativas}" - INICIANDO PROCESSO DOWNLOAD NO NATIVO NA URL: ${url}`);
  
      const nameDb = `sfa-${nome}.db`;
  
      // Verifica se tem o path onde sera salvo os Dbs, e os cria se não existir.
      await hasFileSystemPath();
  
      let percentInt = 0;
  
      // Progresso do download.
      global.downloadResumable = FileSystem.createDownloadResumable(
        url,
        FileSystem.documentDirectory + 'SQLite/' + deviceId + '_' + nameDb,
        options,
        (downloadProgress) => {
          const percent = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
          const hasError = percent === 100 && percentInt === 0;
          if (hasError) {
            return false;
          }
  
          if (parseInt(percent, 10) > percentInt) {
            percentInt = parseInt(percent, 10);
            console.log(`Status download: ${nameDb} ${percentInt}%`);
  
            const obj = {};
            obj[nome] = percentInt;
            this.props.changePorcent(obj);
  
            const objIndeterminate = {};
            objIndeterminate[nome] = false;
            this.props.changeIndeterminate(objIndeterminate);
          }
        },
      );
  
      // Start downlodad;
      const { uri, status } = await global.downloadResumable.resumeAsync();
  
      if (status === 200) {
        console.log('SUCESS', uri, status);
  
        // REGISTRANDO DEVICE COM EXCEÇÃO DO ANDROID.
        // register(nome, cfg);
        // setTimeout(() => {
        //   register(nome, cfg);
        // }, 3000);
      } else {
        if (tentativas < nMaxtentativas) {
          const { host, version, path } = cfg;
          const newUrl = `${host}${version}${path.db}?compress=false&nocache=${new Date().getTime()}`;
          const newOptions = { md5: null, headers: { Authorization: 'Bearer ' + (await getToken()) } };
          await processDownload_NATIVO(cfg, nome, newUrl, newOptions);
        } else {
          console.log(`NUMERO DE TENTATIVAS ESGOTADA, HABILITADO BOTÃO RETRY PARA O DB "${nome}"`);
          const retry = {};
          retry[nome] = true;
          this.props.changeRetry(retry);
        }
      }
    };
  
    const processDownload_ELETRON = async (cfg, nome, url, token) => {
      tentativas++;
  
      console.log(`TENTATIVA "${tentativas}" - INICIANDO PROCESSO DOWNLOAD NO ELETRON NA URL: ${url}`);
  
      const nameDb = `sfa-${nome}`;
  
      // Progresso do download.
      window.webSqlManager.on(`${nameDb}::downloadProgress`, (status) => {
        const obj = {};
        obj[nome] = status.percent;
        this.props.changePorcent(obj);
  
        const objIndeterminate = {};
        objIndeterminate[nome] = false;
        this.props.changeIndeterminate(objIndeterminate);
  
        //console.log('Donwload no Eletron Status porcent:', status.percent);
      });
  
      // GET DE FATO.
      window.webSqlManager.load(nameDb, 'userId', url, token).then(
        // Success
        async (r) => {
          console.log('SUCESS', r.message);
  
          // REGISTRANDO DEVICE COM EXCEÇÃO DO ANDROID.
          setTimeout(() => {
            register(nome, cfg);
          }, 3000);
        },
        // Error
        async (r) => {
          console.log('ERROR', r.message);
          if (tentativas < nMaxtentativas) {
            const { nome, host, version, path } = cfg;
            const token = await getToken();
            const url = `${host}${version}${path.db}?compress=true&nocache=${new Date().getTime()}&access_token=${token}`;
  
            // console.log('REQUEST NA API', url, token);
  
            await processDownload_ELETRON(cfg, nome, url, token);
          } else {
            console.log(`NUMERO DE TENTATIVAS ESGOTADA, HABILITADO BOTÃO RETRY PARA O DB "${nome}"`);
            const retry = {};
            retry[nome] = true;
            this.props.changeRetry(retry);
          }
        }
      );
    };
  
    let tentativas = 0;
  
    const nMaxtentativas = 5;
  
    try {
      const cfg = services.find(srv => srv.nome === service);
      if (!cfg) {
        throw new Error(`Oooops! para o serviço ${service} não foi localizado sua configuração para prosseguir.`);
      }
  
  
      if (await isDbLocal(cfg.nome, deviceId)) {
        const obj = {};
        obj[cfg.nome] = 100;
        this.props.changePorcent(obj);
  
        const objIndeterminate = {};
        objIndeterminate[cfg.nome] = false;
        this.props.changeIndeterminate(objIndeterminate);
  
        return console.log('BANCO JA EXISTENTE, NÃO SERA FEITO O DOWNLOAD NOVAMENTE.');
      }
  
      if (Platform.OS === 'web') {
        const { nome, storageDb } = cfg;
        const url = `${storageDb}/userId/sfa-${nome}.zip?&nocache=${new Date().getTime()}`;
        const token = '';
        await processDownload_ELETRON(cfg, nome, url, token);
      } else {
        const { nome, storageDb } = cfg;
        const url = `${storageDb}/userId/sfa-${nome}.db?&nocache=${new Date().getTime()}`;
        const options = {};
        await processDownload_NATIVO(cfg, nome, url, options);
      }
  
      console.log('PROCESSO FINALIZADO');
    } catch (error) {
      console.log(`ERRO: ${error}.`);
    }
  };
  
  async componentDidMount() {
    // REGISTRANDO DEVICE COM EXCEÇÃO DO ANDROID.
    let deviceId, userId, appId;
    deviceId = await deviceInfo.getDeviceId();
    deviceId = deviceId || await deviceInfo.registerDevice();
    userId = await getUserId();
    appId = await getAppId();

    console.log('>>>', this.props);

    this.onSync({ service: 'account', deviceId, userId, appId });
    this.onSync({ service: 'product', deviceId, userId, appId });
    this.onSync({ service: 'setup', deviceId, userId, appId });
    this.onSync({ service: 'order', deviceId, userId, appId });
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
                      // changePorcent={changePorcent}
                      // changeIndeterminate={changeIndeterminate}
                      // changeRetry={changeRetry}
                    />,
                    <Media
                      onSync={this.onSync}
                      changePorcent={this.props.changePorcent}
                      // changeIndeterminate={this.props.changeIndeterminate}
                      // changeRetry={changeRetry}
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
