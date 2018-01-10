import uuid from 'uuid';

const openpgp = require('openpgp');

export function readPublicKey(publicKey) {
  const key = openpgp.key.readArmored(publicKey);
  const keyid = key.keys[0].primaryKey.keyid.toHex();
  const userStr = key.keys[0].users[0].userId.userid;
  const email = userStr.substring(userStr.lastIndexOf('<') + 1, userStr.lastIndexOf('>'));
  const name = userStr.substring(0, userStr.lastIndexOf(' '));

  return {
    id: uuid(),
    name,
    email,
    keyid,
    publicKey,
  };
}
