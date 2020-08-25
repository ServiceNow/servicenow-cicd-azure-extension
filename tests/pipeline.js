const vars = {};
const defaults = {};

function Pipeline(data) {
    this.options = {...defaults};
    Object.keys(data).forEach(key=>this.options[key] = data[key].toString());
    this.auth = () =>this.options.auth;
    this.url = () =>this.options.url;


    this.get = (name, required=false) => {
        let result = this.options[name];
        if(!result && required) {
            throw new Error(`Input or variable "${name}" is missing`);
        }
        return result;
    };

    this.getVar = name => vars[name];
    this.setVar = (name, value) => {
        vars[name] = value.toString();
    };
    this.success = ()=>{};
    this.fail = ()=>{};
}

Pipeline.defaults = defaultData => Object.keys(defaultData).forEach(key=>defaults[key] = defaultData[key].toString());

module.exports = Pipeline;