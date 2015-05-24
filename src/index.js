/**
 *
 *  .CITY Starter Kit
 *  Copyright 2015 WoT.City Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

'use strict';

/**
 * Modules
 */

var $ = require('jquery');
window.$ = $;
window.jQuery = $;
var _ = require('underscore');
var Backbone = require('backbone');
var Automation = require('automationjs');
var d3 = require('d3');
var Donut3D = require('./Donut3D');

/**
 * Setup
 */

Backbone.$ = window.$;
var app = app || {};

/**
 * MODELS
 **/

app.Container = Backbone.Model.extend({
  url: function() {
    return '/';
  },
  wsUrl: function() {
    return 'ws://wot.city/object/' + this.attributes.name + '/viewer';
  },
  defaults: {
    name: 'test',
    data: '',
    cid: 0,
    temp: 0
  },
  // AutomationJS plugins
  parseJSON: function() {
    // remove internal properties from model
    var objCopy = function(object) {
      var o = {};
      for (var p in object) {
        if (object.hasOwnProperty(p)) {
          // AutomationJS:
          // don't copy internal properties
          if (p === 'name' || p === 'data' || p === 'cid') {
              continue;
          }
          o[p] = object[p];
        }
      }
      return o;
    };

    var o = objCopy(this.attributes);

    this.set('data', JSON.stringify(o));
    this.trigger('sync');
  },
  // Y-Axis getter
  getY: function() {
    return this.get('temperature');
  }
});

/**
 * VIEWS
 **/

app.ContainerView = Backbone.View.extend({
  el: '#gauge',
  stats: {},
  template: _.template( $('#tmpl-gauge').html() ),
  initialize: function() {
    this.component = new Automation({
      el: this.$el,
      model: app.Container,
      template: this.template
    });
    this.d3Init();
  },
  d3Init: function() {
    var self = this;

    this.tempData=[
      {label: "Cold", color: "#3366CC"},
      {label: "Warm", color: "#DC3912"},
      {label: "Hot",  color: "#FF9900"}
    ];

    this.tempData.map(function(d) { 
      self.stats[d.label] = 0;
    });

    var svg = d3.select("#donut").append("svg").attr("width",700).attr("height",300);
    svg.append("g").attr("id","tempDonut");
  },
  render: function(name) {
    this.model = this.component.add({
        name: name
    });
    this.listenTo(this.model, 'sync', this.update);
  },
  syncUp: function(name) {
    this.render(name);
  },
  update: function() {
    var self = this;
    var y = this.model.getY();

    if (y < 20) {
      this.stats['Cold'] = this.stats['Cold'] + 1;
    } else if (y >= 20 && y < 35) {
      this.stats['Warm'] = this.stats['Warm'] + 1;
    } else {
      this.stats['Hot'] = this.stats['Hot'] + 1;
    }

    var data = this.tempData.map(function(d) {
      return { label: d.label, value: self.stats[d.label], color: d.color };
    });

    Donut3D.draw("tempDonut", data, 250, 150, 150, 120, 30, 0.4);
  }
});

/*
 * ROUTES
 */

app.AppRoutes = Backbone.Router.extend({
  routes: {
    ':name': 'appByName'
  },
  appByName: function(name) {
    app.containerView = new app.ContainerView();
    app.containerView.syncUp(name);
  }
});

/**
 * BOOTUP
 **/

$(function() {
  app.appRoutes = new app.AppRoutes();
  Backbone.history.start();
});
