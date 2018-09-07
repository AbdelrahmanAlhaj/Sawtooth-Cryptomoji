import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import { createPrivateKey, getPublicKey } from './services/signing';
import { encodeAll } from './services/transactions';
import { getMojiAddress } from './services/addressing';
import { decode } from './services/encoding';

let pk;

function generatePKAndCreateCollection() {
  pk = createPrivateKey();
  const payload = { action: 'CREATE_COLLECTION' };
  const data = encodeAll(pk, payload);

  axios({
    method: 'post',
    url: '/api/batches',
    headers: { 'content-type': 'application/octet-stream' },
    data: data
  }).then(() => {
    window.alert("private key generated & collection created" + pk);
  })
}

function signIn() {

}

function viewMoji() {
  const publicKey = getPublicKey(pk);
  const namespaceAndType = getMojiAddress(publicKey);

  axios({
    method: 'get',
    url: '/api/state?addresss=' + namespaceAndType
  }).then((response) => {
    console.log(decode(response.data.data[0].data));
  })
}

ReactDOM.render((
  <BrowserRouter>
    <div>
      <div>
        <button onClick={() => generatePKAndCreateCollection()}>
          Create Collections
      </button>
      </div>
      <div>
        <button onClick={() => viewMoji()}>View Moji</button>
      </div>
    </div>
  </BrowserRouter>
), document.getElementById('app'));

{/* <div>
<button onClick={() => signIn()}>
  Sign In
</button>
</div> */}
