const options = {
    test_suite_sys_id:'0a383a65532023008cd9ddeeff7b1258',
    pluginID: 'com.glide.web_service_aggregate',
    app_sys_id:'0cdb16a7db821010969a9646db9619bd',
    sys_id:'0cdb16a7db821010969a9646db9619bd',
    version: '1.0.2',
    // app_scope: 'x_sofse_cicdazurea',
    // scope: 'x_sofse_cicdazurea'

}
module.exports = {
    auth: 'admin:********',
    // url: 'cicdazureappclient.service-now.com',
    url: 'cicdazureappauthor.service-now.com',
    get: (name, required=false) => {
        let result = options[name];
        if(!result && required) {
            throw new Error(`Input or variable "${name}" is missing`);
        }
        return result;
    }
}