const options = {
    test_suite_sys_id:'0a383a65532023008cd9ddeeff7b1258',
    pluginID: 'com.glide.web_service_aggregate',
    app_sys_id:'0cdb16a7db821010969a9646db9619bd',
    // sys_id:'0cdb16a7db821010969a9646db9619bd',
    sys_id:'e68eb8dcdbf1101069625886dc9619c6',
    version: '1.0.3',
    // app_scope: 'x_sofse_cicdazurea',
    scope: 'x_sofse_cicdazurea'
    // scope: 'chiarngtest'

}
module.exports = {
    auth: 'admin:SoftServe1!',
    // url: 'cicdazureappclient.service-now.com',
    url: 'extintprod.service-now.com',
    // url: 'cicdazureappauthor.service-now.com',
    get: (name, required=false) => {
        let result = options[name];
        if(!result && required) {
            throw new Error(`Input or variable "${name}" is missing`);
        }
        return result;
    },
    set: () => {}
}