import axios from 'axios'
import notional from '../notionalVals.json'

function CosmosDirectory(){
  const directoryProtocol = process.env.DIRECTORY_PROTOCOL || 'https'
  const directoryDomain = process.env.DIRECTORY_DOMAIN || 'cosmos.directory'
  const rpcBase = `${directoryProtocol}://rpc.${directoryDomain}`
  const restBase = `${directoryProtocol}://rest.${directoryDomain}`
  const chainsUrl = `${directoryProtocol}://chains.${directoryDomain}`
  const validatorsUrl = `${directoryProtocol}://validators.${directoryDomain}`

  function rpcUrl(name){
    return rpcBase + '/' + name
  }

  function restUrl(name){
    return restBase + '/' + name
  }

  function getChains(){
    return axios.get(chainsUrl)
      .then(res => res.data)
      .then(data => Array.isArray(data) ? data : data.chains) // deprecate
      .then(data => data.reduce((a, v) => ({ ...a, [v.path]: v }), {}))
  }

  function getChainData(name) {
    return axios.get([chainsUrl, name].join('/'))
      .then(res => res.data.chain)
  }

  async function getTokenData(name) {
    return axios.get([chainsUrl, name, 'assetlist'].join('/'))
      .then(res => res.data)
  }

  async function getValidators(chainName){
    const allValidator = await (await axios.get(validatorsUrl + '/chains/' + chainName)).data.validators
    const notionalValIndex = allValidator.findIndex((obj => obj.moniker == "notional"))
    const chainRestake= notional.chains.find((obj => obj.name == chainName))
    allValidator[notionalValIndex]["restake"] = {
      address: chainRestake.restake,
      run_time: "01:00",
      minimum_reward: 0
    }
    return allValidator
    
  }

  function getOperatorCounts(){
    return axios.get(validatorsUrl)
      .then(res => res.data)
      .then(data => Array.isArray(data) ? data : data.validators) // deprecate
      .then(data => data.reduce((sum, validator) => {
        validator.chains.forEach(chain => {
          sum[chain.name] = sum[chain.name] || 0
          if(!!chain.restake) sum[chain.name]++
        })
        return sum
      }, {}))
  }

  async function getOperatorCounts(){
    const response = await (await axios.get(validatorsUrl)).data
    const data = Array.isArray(response) ? response : response.validators
    data.push(notional)
    const result = data.reduce((sum, validator) => {
      validator.chains.forEach(chain => {
        sum[chain.name] = sum[chain.name] || 0
        if(!!chain.restake) sum[chain.name]++
      })
      return sum
    }, {})
    return result
  }

  return {
    rpcUrl,
    restUrl,
    chainsUrl,
    getChains,
    getChainData,
    getTokenData,
    getValidators,
    getOperatorCounts
  }
}

export default CosmosDirectory