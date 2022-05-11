import axios from "axios";
import notional from "../notionalVals.json";
import apis from "../validator_apis.json";

function CosmosDirectory() {
  const directoryProtocol = process.env.DIRECTORY_PROTOCOL || "https";
  const directoryDomain = process.env.DIRECTORY_DOMAIN || "cosmos.directory";
  const rpcBase = `${directoryProtocol}://rpc.${directoryDomain}`;
  const restBase = `${directoryProtocol}://rest.${directoryDomain}`;
  const chainsUrl = `${directoryProtocol}://chains.${directoryDomain}`;
  const validatorsUrl = `${directoryProtocol}://validators.${directoryDomain}`;

  function rpcUrl(name) {
    return rpcBase + "/" + name;
  }

  function restUrl(name) {
    return restBase + "/" + name;
  }

  function getChains() {
    return axios
      .get(chainsUrl)
      .then((res) => res.data)
      .then((data) => (Array.isArray(data) ? data : data.chains)) // deprecate
      .then((data) => data.reduce((a, v) => ({ ...a, [v.path]: v }), {}));
  }

  function getChainData(name) {
    return axios.get([chainsUrl, name].join("/")).then((res) => res.data.chain);
  }

  async function getTokenData(name) {
    return axios
      .get([chainsUrl, name, "assetlist"].join("/"))
      .then((res) => res.data);
  }

  async function getValidators(chainName) {
    const allValidator = await (
      await axios.get(validatorsUrl + "/chains/" + chainName)
    ).data.validators;
    const pingpubValidators = await (
      await axios.get(apis[chainName])
    ).data.result;

    let notional_pingpub = pingpubValidators.find(
      (obj) => obj.description.identity == "3804A3D13B6CB379"
    );
    if (notional_pingpub) {
      const chainRestake = notional.chains.find(
        (obj) => obj.name == chainName
      );
      let notionalValIndex = allValidator.findIndex(
        (obj) => obj.identity == "3804A3D13B6CB379"
      );
      if (notionalValIndex == -1) {
        notionalValIndex = allValidator.length;
        allValidator.push({
          moniker: "Notional",
          identity: "3804A3D13B6CB379",
          address: notional_pingpub.operator_address,
          operator_address: notional_pingpub.operator_address,
          consensus_pubkey: notional_pingpub.consensus_pubkey,
          jailed: false,
          status: "BOND_STATUS_BONDED",
          tokens: notional_pingpub.tokens,
          delegator_shares: notional_pingpub.delegator_shares,
          description: notional_pingpub.description,
          unbonding_height: notional_pingpub.unbonding_height,
          unbonding_time: notional_pingpub.unbonding_height,
          commission: notional_pingpub.commission,
          min_self_delegation: notional_pingpub.min_self_delegation,
          rank: 9,
          mintscan_image:
            "https://raw.githubusercontent.com/cosmostation/cosmostation_token_resource/master/moniker/konstellation/darcvaloper1fndgrsqmmq68ppl42wjkxh32nwpuj7vqtgep38.png",
          keybase_image:
            "https://s3.amazonaws.com/keybase_processed_uploads/6ce44a0b3bbd2a99933ccb10a4a46305_360_360.jpg"
        });
        
      }
      allValidator[notionalValIndex]["restake"] = {
        address: chainRestake.restake,
        run_time: "01:00",
        minimum_reward: 0,
      };
      console.log(allValidator)
      return allValidator;
    } else {
      return allValidator;
    }
  }

  function getOperatorCounts() {
    return axios
      .get(validatorsUrl)
      .then((res) => res.data)
      .then((data) => (Array.isArray(data) ? data : data.validators)) // deprecate
      .then((data) =>
        data.reduce((sum, validator) => {
          validator.chains.forEach((chain) => {
            sum[chain.name] = sum[chain.name] || 0;
            if (!!chain.restake) sum[chain.name]++;
          });
          return sum;
        }, {})
      );
  }

  async function getOperatorCounts() {
    const response = await (await axios.get(validatorsUrl)).data;
    const data = Array.isArray(response) ? response : response.validators;
    data.push(notional);
    const result = data.reduce((sum, validator) => {
      validator.chains.forEach((chain) => {
        sum[chain.name] = sum[chain.name] || 0;
        if (!!chain.restake) sum[chain.name]++;
      });
      return sum;
    }, {});
    return result;
  }

  return {
    rpcUrl,
    restUrl,
    chainsUrl,
    getChains,
    getChainData,
    getTokenData,
    getValidators,
    getOperatorCounts,
  };
}

export default CosmosDirectory;
