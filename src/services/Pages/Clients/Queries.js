import SrvClients from '../../Account';
import { queryBuilder as query } from '../../Repository/AccountDb';

export const getSituations = async () => {
  const SITUATION  = 'sf_situacao__c';
  const select = query
  .select()
  .distinct()
  .field(SITUATION)
  .from('vw_account')
  .where(`${SITUATION} IS NOT NULL`)
  .where("sf_situacao__c <> ''");
  const results = await SrvClients.customQuery(select, null, true);
  const situations = results.map((r, index) => ({
    option: r[SITUATION],
    key: index.toString(),
  }));
  return situations;
};
