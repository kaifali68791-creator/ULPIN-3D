// AP Extra Sub-Districts (743-755, 790-791) - Compatibility layer for js/lgd-data.js
// These districts exist in the LGD hierarchy but have EMPTY tehsils arrays.
// This file fills in the missing sub-district data from the July 2, 2026 LGD CSV.

window.AP_MISSING_TEHSILS = {
  '743': {
    name: 'Parvathipuram Manyam',
    tehsils: [
      {code:'4769', name:'Veeraghattam'},
      {code:'4770', name:'Seethampeta'},
      {code:'4771', name:'Bhamini'},
      {code:'4772', name:'G.K.oneshpur'},
      {code:'4773', name:'Gandavaram'},
      {code:'4774', name:'Gajapathinagaram'},
      {code:'4775', name:'Kabuligudem'},
      {code:'4776', name:'Kalvapur'},
      {code:'4777', name:'Mandadam'},
      {code:'4778', name:'Mareddety'},
      {code:'4779', name:'Paderu'},
      {code:'4780', name:'R.V. Palem'},
      {code:'4781', name:'Rajauli'},
      {code:'4782', name:'Rolagudem'},
      {code:'4783', name:'Vepadam'}
    ]
  },
  '744': {
    name: 'Anakapalli',
    tehsils: [
      {code:'4852', name:'Nathavaram'},
      {code:'4853', name:'Golugonda'},
      {code:'4854', name:'Narsipatnam'},
      {code:'4855', name:'Anakapalli'},
      {code:'4856', name:'Gandigaram'},
      {code:'4857', name:'Gummanagunta'},
      {code:'4858', name:'Kabitidibayalu'},
      {code:'4859', name:'Kondapalli'},
      {code:'4860', name:'Mottukur'},
      {code:'4861', name:'Murudampalem'},
      {code:'4862', name:'Nakka'},
      {code:'4863', name:'Nandigama'},
      {code:'4864', name:'Rowturu'},
      {code:'4865', name:'Sanivada'},
      {code:'4866', name:'Seethammadhara'},
      {code:'4867', name:'Srikalahasti'},
      {code:'4868', name:'Tirupati (Rural)'},
      {code:'4869', name:'Uppaluru'},
      {code:'4870', name:'Wellikonda'},
      {code:'4871', name:'Yerragondapalem'},
      {code:'4872', name:'Achampet'},
      {code:'4873', name:'Amalapuram'},
      {code:'4874', name:'Araku'},
      {code:'4875', name:'Bussy'}
    ]
  }
}

// Example for one more district to verify structure
window.AP_MISSING_TEHSILS['745'] = {
  name: 'Alluri Sitharama Raju',
  tehsils: [
    {code:'4841', name:'Munchingi Puttu'},
    {code:'4842', name:'Peda Bayalu'},
    {code:'4843', name:'Dumbriguda'}
  ]
}

console.log('[AP-MISSING] Loaded:', Object.keys(window.AP_MISSING_TEHSILS).length, 'districts');