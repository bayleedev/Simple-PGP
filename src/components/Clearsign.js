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
  passphrase: {
    outline: 'none',
    border: 'none',
    borderBottom: `1px solid ${colours.midnightBlue}`,
    margin: 15,
    marginBottom: 0,
    paddingBottom: 10,
  },
});

@inject('appStore')
@observer
export default class Clearsign extends Component {

  static propTypes = {
    appStore: MobxPropTypes.objectOrObservableObject,
  }

  state = {
    message: '',
    passphrase: '',
    encrypted: false,
  }

  handleSubmit = (e) => {
    new Promise((resolve) => {
      resolve(openpgp.key.readArmored(this.props.appStore.privateKey).keys[0]);
    }).then((privateKey) => {
      privateKey.decrypt(this.state.passphrase);
      return openpgp.sign({
        data: this.state.message,
        privateKeys: privateKey,
      });
    }).then((cleartext) => {
      this.setState({
        message: cleartext.data,
        encrypted: true,
      });
    }).catch((error) => {
      dialog.showErrorBox('Error', error.message);
    });
    e.preventDefault();
  }

  handleInputChange = (e) => {
    this.setState({
      message: e.target.value,
    });
  }

  handlePassphraseChange = (e) => {
    this.setState({
      passphrase: e.target.value,
    });
  }

  copyReset = () => {
    clipboard.writeText(this.state.message);
    this.setState({
      message: '',
      encrypted: false,
    });
  }

  render() {
    const button = this.state.encrypted ? (
      <a onClick={this.copyReset} className={css(componentStyles.button)}>
        Copy to clipboard and clear
      </a>
    ) : (
      <a onClick={this.handleSubmit} className={css(componentStyles.button)}>Clearsign Message</a>
    );
    return (
      <form className={css(componentStyles.form)}>
        <div className={css(componentStyles.inputWrapper)}>
          <textarea
            className={css(componentStyles.input)}
            placeholder="Compose message here..."
            onChange={this.handleInputChange}
            value={this.state.message}
          />
          { this.state.encrypted || (
            <input
              className={css(componentStyles.passphrase)}
              type="password"
              placeholder="Passphrase for your private key"
              value={this.state.passphrase}
              onChange={this.handlePassphraseChange}
            />
          ) }
        </div>
        {button}
      </form>
    );
  }

}
