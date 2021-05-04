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

    async getLayout(depotId) {
        try {
            const url = `${this.base}/GetLayout`;
            const res = await axios.get(url, {
                params: {
                    code: "HAzwypx06J1lLS6FgP2C3luLW3QE/U/iY0UVxHNf0DaXmondvohgIQ==",
                    Depot_Id: depotId
                }
            });
            return res.data;
        } catch (error) {
            console.log(error);
        }
    }

    async getCategories(depotId) {
        try {
            const url = `${this.base}/GetCategories`;
            const res = await axios.get(url, {
                params: {
                    code: "DVEIM74Odx9tmHUaTQC9Vw5sn8vh11nUDgKCyaQAEDmZsLyceTjP4g==",
                    Depot_Id: depotId
                }
            });
            return res.data;
        } catch (error) {
            console.log(error);
        }
    }

    async getLocHistory(depotId, loc, startDate, endDate) {
        try {
            const url = `${this.base}/GetLocHistory`;
            const res = await axios.get(url, {
                params: {
                    code: "oAYBeb0JJQr1fDBA9SkauwGsQA7hNNSOnbtipjyTxNnrY09lgmpxKw==",
                    Depot_Id: depotId,
                    Location: loc,
                    "Date-LowerBound": startDate,
                    "Date-UpperBound": endDate
                }
            });
            return res.data.info;
        } catch (error) {
            console.log(error);
        }
    }

    async uploadNewLayout(depotId, form) {
        try {
            const url = `${this.base}/InsertLayout`;
            let data = new FormData(form)
            const res = await axios({
                method: 'post',
                url,
                data,
                params: {
                    code: "6mwa4yhvCbwyc6UONSZAUqkwv4O2v4C0/rT5HAOgTvbku5a/WtRicA==",
                    Depot_Id: depotId
                }
            });
            return res.data;
            // return "res.data";

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
            return res.data.info;
        } catch (error) {
            console.log(error);
        }
    }
}

export default DataController;