import React, { Component } from 'react';
import { css, StyleSheet } from 'aphrodite';
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react';
import { colours } from 'utils/constants';

const openpgp = require('openpgp');

const componentStyles = StyleSheet.create({
  form: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  inputWrapper: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    outline: 'none',
    fontSize: 14,
    border: 'none',
    background: colours.white,
    padding: 15,
    color: colours.black,
    flexGrow: 1,
  },
  button: {
    backgroundColor: colours.midnightBlue,
    color: colours.clouds,
    padding: 15,
    textAlign: 'center',
    cursor: 'pointer',
    textTransform: 'uppercase',
    fontSize: 14,
  },
  passphrase: {
    outline: 'none',
    border: 'none',
    margin: 15,
    marginBottom: 0,
    paddingBottom: 10,
  },
});

@inject('appStore')
@observer
export default class EncryptMessage extends Component {

  static propTypes = {
    appStore: MobxPropTypes.objectOrObservableObject,
  }

  state = {
    message: '',
    passphrase: '',
    decrypted: false,
  }

  handleChangeMessage = (e) => {
    this.setState({
      message: e.target.value,
    });
  }

  handlePassphraseChange = (e) => {
    this.setState({
      passphrase: e.target.value,
    });
  }

  decrypt = () => {
    if (this.state.message.length) {
      const appStore = this.props.appStore;
      const privateKey = openpgp.key.readArmored(this.props.appStore.privateKey).keys[0];
      privateKey.decrypt(this.state.passphrase);
      openpgp.decrypt({
        publicKeys: appStore.publicKeys(),
        message: openpgp.message.readArmored(this.state.message),
        privateKey,
      }).then(({ data, signatures }) => {
        const keyid = signatures[0].keyid.toHex();
        const foundKey = appStore.findKey(keyid);
        if (foundKey) {
          this.setState({
            message: [
              'Verified signature from:',
              foundKey.keyid,
              foundKey.name,
              foundKey.email,
              '',
              data,
            ].join('\n'),
            decrypted: true,
          });
        } else {
          this.setState({
            message: [
              `Unknown signature: ${keyid}`,
              '',
              data,
            ].join('\n'),
            decrypted: true,
          });
        }
      });
    }
  }

  clearMessage = () => {
    this.setState({
      message: '',
      decrypted: false,
    });
  }

  render() {
    const button = this.state.decrypted ? (
      <a onClick={this.clearMessage} className={css(componentStyles.button)}>Clear</a>
    ) : (
      <a onClick={this.decrypt} className={css(componentStyles.button)}>Decrypt</a>
    );

    return (
      <form className={css(componentStyles.form)}>
        <div className={css(componentStyles.inputWrapper)}>
          <textarea
            className={css(componentStyles.input)}
            value={this.state.message}
            onChange={this.handleChangeMessage}
            placeholder="Paste encrypted message..."
          />
          <input
            className={css(componentStyles.passphrase)}
            type="password"
            placeholder="Passphrase for your private key"
            value={this.state.passphrase}
            onChange={this.handlePassphraseChange}
          />
        </div>
        {button}
      </form>
    );
  }

}
