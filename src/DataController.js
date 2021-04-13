const axios = require('axios');

class DataController {
    constructor({ url }) {
        this.base = url;
    }

    async getCurrentStock() {
        try {
            const url = `${this.base}/stock`;
            const res = await axios.get(url);
            return res.data;
        } catch (error) {
            console.log(error);
        }
    }

    async getFillRate() {
        try {
            const url = `${this.base}/fillRate`;
            const res = await axios.get(url);
            return res.data;
        } catch (error) {
            console.log(error);
        }
    }

    async getDepotInfo() {
        try {
            const url = `${this.base}/depotInfo`;
            const res = await axios.get(url);
            return res.data;
        } catch (error) {
            console.log(error);
        }
    }
}

export default DataController;