import React, { Component, PropTypes } from 'react';
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
  signWrapper: {
    padding: 15,
    display: 'flex',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 5,
  },
  passphrase: {
    outline: 'none',
    border: 'none',
    borderBottom: `1px solid ${colours.midnightBlue}`,
    margin: 15,
    marginBottom: 0,
    paddingBottom: 10,
  },
  checkboxSpan: {
    fontSize: 14,
    textTransform: 'uppercase',
  },
});

@inject('appStore')
@observer
export default class EncryptMessage extends Component {

  static propTypes = {
    appStore: MobxPropTypes.objectOrObservableObject,
    params: PropTypes.shape({
      id: PropTypes.id,
    }),
  }

  state = {
    message: '',
    passphrase: '',
    encrypted: false,
    sign: false,
    addYourself: false,
  }

  componentDidMount() {
    this.user = this.props.appStore.friends
      .filter(friend => friend.id === this.props.params.id)[0];
  }

  handleSubmit = (e) => {
    new Promise((resolve) => {
      const privateKey = openpgp.key.readArmored(this.props.appStore.privateKey).keys[0];
      if (this.state.sign) {
        privateKey.decrypt(this.state.passphrase);
      }
      const publicKeys = this.state.addYourself ? [
        ...openpgp.key.readArmored(this.user.publicKey).keys,
        ...openpgp.key.readArmored(this.props.appStore.publicKey).keys,
      ] : [
        ...openpgp.key.readArmored(this.user.publicKey).keys,
      ];
      const message = this.state.message.replace(/\n?$/, '\n');

      resolve(openpgp.encrypt({
        data: message,
        publicKeys,
        privateKeys: this.state.sign && privateKey,
      }));
    }).then(ciphertext => (
      this.setState({
        message: ciphertext.data,
        encrypted: true,
        sign: false,
      })
    )).catch((err) => {
      dialog.showErrorBox('Error', err.message);
    });
    e.preventDefault();
  }

  handleInputChange = (e) => {
    this.setState({
      message: e.target.value,
    });
  }

  handleSignIt = (e) => {
    this.setState({
      sign: e.target.checked,
    });
  }

  handleAddYourself = (e) => {
    this.setState({
      addYourself: e.target.checked,
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
      <a onClick={this.handleSubmit} className={css(componentStyles.button)}>Encrypt Message</a>
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
          {
            this.state.sign && (
              <input
                className={css(componentStyles.passphrase)}
                type="password"
                placeholder="Passphrase for your private key"
                value={this.state.passphrase}
                onChange={this.handlePassphraseChange}
              />
            )
          }
          {
            !this.state.encrypted && (
              <div className={css(componentStyles.signWrapper)}>
                <input
                  className={css(componentStyles.checkbox)}
                  id="signIt"
                  type="checkbox"
                  onChange={this.handleSignIt}
                  checked={this.state.sign}
                />
                <label htmlFor="signIt" className={css(componentStyles.checkboxSpan)}>Sign Message?</label>
              </div>
            )
          }
          {
            !this.state.encrypted && (
              <div className={css(componentStyles.signWrapper)}>
                <input
                  className={css(componentStyles.checkbox)}
                  id="addYourself"
                  type="checkbox"
                  onChange={this.handleAddYourself}
                  checked={this.state.addYourself}
                />
                <label htmlFor="addYourself" className={css(componentStyles.checkboxSpan)}>Add yourself as a recepient?</label>
              </div>
            )
          }
        </div>
        {button}
      </form>
    );
  }

}
