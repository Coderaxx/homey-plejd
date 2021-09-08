'use strict';

const Homey = require('homey');

const api = require('../../lib/api');

class PlejdButtonDriver extends Homey.Driver {

  async onInit() {
    this.log('Plejd driver has been inited');
  }

  onPair(session) {
    const self = this;
    let plejdSites;
    let plejdApi;

    session.setHandler('showView', async viewId => {
      if (viewId === 'login') {
        self.log('Try login');

        const sessionToken = this.homey.settings.get('sessionToken');

        if (sessionToken) {
          plejdApi = new api.PlejdApi(null, null, sessionToken);

          self.log('Getting sites');

          const sites = await plejdApi.getSites();

          self.log('sites', sites);

          if (sites) {
            plejdSites = sites;
            await session.nextView();
          } else {
            this.homey.settings.set('sessionToken', null);
            return Promise.resolve(true);
          }
        } else {
          return Promise.resolve(true);
        }
      }

      return Promise.resolve(true);
    });

    session.setHandler('login', async data => {
      let { username } = data;
      const { password } = data;

      if (username) {
        username = username.toLowerCase();
      }

      plejdApi = new api.PlejdApi(username, password);

      const token = await plejdApi.login();

      if (token) {
        this.homey.settings.set('sessionToken', token);
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    });

    session.setHandler('getSites', async () => {
      self.log('Getting sites');
      if (plejdSites) {
        return plejdSites;
      }
      const sites = plejdApi.getSites();
      self.log('sites', sites);

      return sites;
    });

    session.setHandler('saveSite', async data => {
      await plejdApi.getSite(data.site);
      self.log(`Saving site: ${data.site}`);

      return null;
    });

    session.setHandler('list_devices', async () => {
      const devices = [];

      const cryptoKey = plejdApi.getCryptoKey();
      this.homey.settings.set('cryptokey', cryptoKey);

      const plejdDevices = plejdApi.getDevices('button');

      plejdDevices.forEach(plejdDevice => {
        devices.push({
          name: plejdDevice.name,
          data: {
            id: plejdDevice.deviceId,
            plejdId: plejdDevice.id
          }
        });
      });

      /*
      devices.push({
        name: 'Knapp hallen',
        data: {
          id: 'CA01C95C6BB9',
          plejdId: 40
        }
      });
      */

      return devices;
    });
  }

}

module.exports = PlejdButtonDriver;
