function createSinkHolderMixin (execlib) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q;

  //Mixin-ers have to implement acquireSink
  
  function purgeSinkHolderListener (sh) {
    if (!sh) {
      return;
    }
    if (sh.sinkDestroyedListener) {
      sh.sinkDestroyedListener.destroy();
    }
    sh.sinkDestroyedListener = null;
  }

  function purgeSinkHolderSink (sh) {
    if (!sh) {
      return;
    }
    if (sh.sink) {
      sh.sink.destroy();
    }
    sh.sink = null;
  }

  function SinkHolderMixin () {
    this.sink = null;
    this.sinkDestroyedListener = null;
  }
  SinkHolderMixin.prototype.destroy = function () {
    purgeSinkHolderListener(this);
    purgeSinkHolderSink(this);
  };
  SinkHolderMixin.prototype.registerSink = function (sink) {
    purgeSinkHolderListener(this);
    purgeSinkHolderSink(this);
    this.sink = sink;
    if (sink) {
      this.sinkDestroyedListener = sink.destroyed.attach(this.onSinkDown.bind(this));
    }
    return q(sink);
  };
  SinkHolderMixin.prototype.onSinkDown = function (modulename) {
    this.sink = null;
    this.activate();
  };
  SinkHolderMixin.prototype.activate = function () {
    if (this.sink) {
      return q(true);
    }
    //Mixin-ers have to implement acquireSink
    return this.acquireSink();
  };
  SinkHolderMixin.prototype.deactivate = function () {
    var d = q.defer();
    if (!(this.sink && this.sink.destroyed)) {
      d.resolve(true);
    } else {
      purgeSinkHolderListener(this);
      this.sinkDestroyedListener = this.sink.destroyed.attach(
        this.onSinkDeactivated.bind(this, d, this.sink.modulename)
      );
      purgeSinkHolderSink(this);
    }
    return d.promise;
  };
  SinkHolderMixin.prototype.onSinkDeactivated = function (defer, modulename) {
    this.sink = null;
    this.destroy();
    defer.resolve(true);
  };

  SinkHolderMixin.addMethods = function (klass) {
    lib.inheritMethods(klass, SinkHolderMixin
      ,'registerSink'
      ,'onSinkDown'
      ,'activate'
      ,'deactivate'
      ,'onSinkDeactivated'
    );
  };

  return SinkHolderMixin;
}

module.exports = createSinkHolderMixin;
