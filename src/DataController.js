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

    async getLayout() {
        try {
            const url = `${this.base}/GetLayout`;
            const res = await axios.get(url, {
                params: {
                    code: "HAzwypx06J1lLS6FgP2C3luLW3QE/U/iY0UVxHNf0DaXmondvohgIQ=="
                },
                data: {
                    Depot_Id: "02579e13-8d4f-4463-968d-7affe4b9919f"
                }
            });
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

    async getDepots() {
        try {
            const url = `${this.base}/GetDepots`;
            const res = await axios.get(url, {
                params: {
                    code: "F0aJNaES2qvRS1S6MGECqOk8asL61LkBnzjVgK3eKdOaomF5zyGH4A=="
                }
            });
            console.log(res)
            return res.data.info;
        } catch (error) {
            console.log(error);
        }
    }
}

export default DataController;