'use strict';
var generators = require('yeoman-generator'),
  _ = require('lodash'),
  pkg = require('../package.json'),
  Promise = require('bluebird'),
  glob = Promise.promisify(require('glob'));

module.exports = generators.Base.extend({
  initializing : {
    async : function() {
      this.options.addDevDependency(pkg.name, '~' + pkg.version);
    }
  },
  
  prompting : function() {
    var that = this;
    var php_versions = [
      { name:'5.6', value:'php56u' },
      { name:'7.1', value:'php71u' },
      { name:'7.0', value:'php70u' },
      { name:'5.3', value:'php' },
    ];
    var mysql_versions = [
      { name:'5.6', value:'mysql56u' },
      { name:'5.7', value:'mysql57u' },
      { name:'5.5', value:'mysql55' },
    ];
    var config = _.extend({
      // Put default config values here
      php_base : 'php56u',
      mysql_base : 'mysql56u',
      mysql_password : 'web',
      doc_root : '/vagrant/public',
      search : 'None',
    }, this.config.getAll());

    return that.prompt([{
      // Put config prompts here
      type : 'input',
      name : 'doc_root',
      message : 'Specify the document root:',
      default : config.doc_root
    },
    {
      // Put config prompts here
      type : 'checkbox',
      name : 'search',
      choices : mysql_versions,
      message : 'Select a search provider',
      default : config.search,
      choices : [ 'solr3', 'solr4', 'elasticsearch' ]
    },
    {
      // Put config prompts here
      type : 'list',
      name : 'php_base',
      choices : php_versions,
      message : 'Select a version of PHP',
      default : config.php_base
    },
    {
      // Put config prompts here
      type : 'list',
      name : 'mysql_base',
      choices : mysql_versions,
      message : 'Select a version of MySQL',
      default : config.mysql_base
    },
    {
      type: 'input',
      name: 'mysql_password',
      message: 'Input desired mysql password:',
      default : config.mysql_password
    }])
    .then(function(answers) {
      that.config.set(answers);

      // Expose the answers on the parent generator
      _.extend(that.options.parent.answers, { 'web-starter-salt' : answers });
    });
  },
  writing : {
    // Put functions to write files / directories here
    settings : function() {
      // Get current system config for this sub-generator
      var config = this.config.getAll();
      _.extend(config, this.options.parent.answers);

      var that = this;
      
      var ignoreFiles = [];

      // If project.sls exists don't overwrite it
      if (this.fs.exists('salt/roots/pillars/project.sls')) {
        ignoreFiles.push('**/project.sls');
      }
      
      return glob('**', {
        cwd : this.templatePath(''), 
        dot: true, 
        nodir : true,
        ignore : ignoreFiles
      }).then(function(files) {
        _.each(files, function(file) {
          that.fs.copyTpl(that.templatePath(file), that.destinationPath(file), config);
        });
      });
    }
  }
});
