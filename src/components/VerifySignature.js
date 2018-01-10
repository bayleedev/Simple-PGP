import React, { Component } from 'react';
import { css, StyleSheet } from 'aphrodite';
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react';
import { colours } from 'utils/constants';

const openpgp = require('openpgp');
const { remote, clipboard } = require('electron');

const { dialog } = remote;

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
});

@inject('appStore')
@observer
export default class VerifySignature extends Component {

  static propTypes = {
    appStore: MobxPropTypes.objectOrObservableObject,
  }

  state = {
    message: '',
    verified: false,
  }

  handleSubmit = (e) => {
    const appStore = this.props.appStore;
    new Promise((resolve) => {
      resolve({
        message: openpgp.cleartext.readArmored(this.state.message),
        keys: appStore.publicKeys(),
      });
    }).then(({ message, keys }) => (
      openpgp.verify({
        message,
        publicKeys: keys,
      })
    )).then((verified) => {
      //  const validity = verified.signatures[0].valid;
      const keyid = verified.signatures[0].keyid.toHex();
      return {
        keyid,
        foundKey: appStore.findKey(keyid),
      };
    }).then(({ keyid, foundKey }) => {
      if (foundKey) {
        this.setState({
          message: [
            'Verified signature from:',
            foundKey.keyid,
            foundKey.name,
            foundKey.email,
          ].join('\n'),
          verified: true,
        });
      } else {
        this.setState({
          message: `Unknown signer: ${keyid}.`,
          verified: true,
        });
      }
    }).catch(err => (
      dialog.showErrorBox('Error', err.message)
    ));
    e.preventDefault();
  }

  handleInputChange = (e) => {
    this.setState({
      message: e.target.value,
    });
  }

  copyReset = () => {
    clipboard.writeText(this.state.message);
    this.setState({
      message: '',
      verified: false,
    });
  }

  render() {
    const button = this.state.verified ? (
      <a onClick={this.copyReset} className={css(componentStyles.button)}>
        Copy to clipboard and clear
      </a>
    ) : (
      <a onClick={this.handleSubmit} className={css(componentStyles.button)}>Verify Message</a>
    );
    return (
      <form className={css(componentStyles.form)}>
        <div className={css(componentStyles.inputWrapper)}>
          <textarea
            className={css(componentStyles.input)}
            placeholder="Paste encrypted message..."
            onChange={this.handleInputChange}
            value={this.state.message}
          />
        </div>
        {button}
      </form>
    );
  }

}
