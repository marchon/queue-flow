var q = require('../lib/queue-flow');
var fs = require('fs');

exports.toArray = function(test) {
	test.expect(1);
	q([1, 2, 3])
		.toArray(function(result) {
			test.equal([1, 2, 3].toString(), result.toString(), 'array passes through the queue');
			test.done();
		});
};

exports.toArrayNamedQueue = function(test) {
	test.expect(1);
	q([1, 2, 3]).toArray('testToArrayNamedQueue');
	q('testToArrayNamedQueue')
		.each(function(result) {
			test.equal([1, 2, 3].toString(), result.toString(), 'array passed to named queue');
			test.done();
		});
};

exports.toArrayAnonQueue = function(test) {
	test.expect(1);
	q([1, 2, 3])
		.toArray()
		.each(function(result) {
			test.equal([1, 2, 3].toString(), result.toString(), 'array passed on in anonymous queue');
			test.done();
		});
};

exports.as = function(test) {
	test.expect(1);
	q([1, 2, 3]).as('test1');
	q('test1').closeOnEmpty().toArray(function(result) {
		test.equal([1, 2, 3].toString(), result.toString(), 'named queue properly referenceable');
		test.done();
	});
};

exports.push = function(test) {
	test.expect(1);
	q('test2').push(1, 2, 3).closeOnEmpty().toArray(function(result) {
		test.equal([1, 2, 3].toString(), result.toString(), 'named queue with elements pushed after-the-fact properly referenceable');
		test.done();
	});
};

exports.map = function(test) {
	test.expect(1);
	q([1, 2, 3]).map(function(value) {
		return value*2;
	}).toArray(function(result) {
		test.equal([2, 4, 6].toString(), result.toString(), 'queue mapped properly');
		test.done();
	});
};

exports.reduce = function(test) {
	test.expect(1);
	q([1, 2, 3])
		.reduce(function(prev, curr) {
			return prev + curr;
		}, function(result) {
			test.equal(6, result, 'queue reduced properly');
			test.done();
		}, 0);
};

exports.reduceNamedQueue = function(test) {
	test.expect(1);
	q([1, 2, 3])
		.reduce(function(prev, curr) {
			return prev + curr;
		}, 'testReduceNamedQueue', 0);
	q('testReduceNamedQueue')
		.each(function(result) {
			test.equal(6, result, 'reduce passed to named queue');
			test.done();
		});
};

exports.reduceAnonQueue = function(test) {
	test.expect(1);
	q([1, 2, 3])
		.reduce(function(prev, curr) {
			return prev + curr;
		}, null, 0)
		.each(function(result) {
			test.equal(6, result, 'reduce passed to anon queue');
			test.done();
		});
};

exports.filter = function(test) {
	test.expect(1);
	q([1, 2, 'skip a few', 99, 100])
		.filter(function(value) {
			return value == value + 0;
		})
		.toArray(function(result) {
			test.equal([1, 2, 99, 100].toString(), result.toString(), 'queue properly filtered');
			test.done();
		});
};

exports.on = function(test) {
	test.expect(5);
	q([1, 2, 3])
		.on('close', function() {
			test.ok(true, 'close event fired');
			test.done();
		})
		.on('pull', function() {
			test.ok(true, 'pull event fired');
		})
		.on('empty', function() {
			test.ok(true, 'empty event fired');
		})
		.toArray(function() { });
	q([1, 2, 3])
		.on('close', function() {
			return false;
		})
		.toArray(function() {
			test.ok(false, 'array method never executes final callback');
		});
};

exports.branch = function(test) {
	test.expect(3);
	q([1, 2, 'skip a few', 99, 100])
		.branch(function(value) {
			if(value == value + 0) {
				return value > 50 ? 'big' : 'small';
			} else {
				return 'invalid';
			}
		});
	var num = 0;
	q('big')
		.toArray(function(result) {
			test.equal([99, 100].toString(), result.toString(), 'big queue properly populated');
			num++;
			if(num == 3) test.done();
		});
	q('small')
		.toArray(function(result) {
			test.equal([1, 2].toString(), result.toString(), 'small queue properly populated');
			num++;
			if(num == 3) test.done();
		});
	q('invalid')
		.toArray(function(result) {
			test.equal(['skip a few'].toString(), result.toString(), 'invalid queue properly populated');
			num++;
			if(num == 3) test.done();
		});
};

exports.latency = function(test) {
	test.expect(1);
	var currentMapVal = Infinity;
	var reducedLatency = false;
	q([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
		.map(function(val) {
			currentMapVal = val;
			return val;
		})
		.reduce(function(prev, val) {
			if(currentMapVal < 10) {
				reducedLatency = true;
			}
			return val;
		}, function(result) {
			test.ok(reducedLatency, 'reduce started processing before map completed');
			test.done();
		});
};

exports.async = function(test) {
	test.expect(1);
	q([1, 2, 3])
		.map(q.async(function(val, callback) {
			callback(val*2);
		}))
		.map(function(val, callback) {
			callback(val);
		})
		.toArray(function(result) {
			test.equal([2, 4, 6].toString(), result.toString(), 'asynchronous methods also complete as expected');
			test.done();
		});
};

exports.everySome = function(test) {
	test.expect(2);
	var count = 0;
	q([1, 2, 'buckle my shoe'])
		.every(function(value) {
			return value == value*1;
		}, function(result) {
			test.equal(false, result, 'every finds the string and barfs');
			count++;
			if(count == 2) test.done();
		});
		q([3, 4, 'shut the door']).some(function(value) {
			return value == value*1;
		}, function(result) {
			test.equal(true, result, 'some finds the first number');
			count++;
			if(count == 2) test.done();
		});
};

exports.everySomeNamedQueue = function(test) {
	// No need to test both branches because they use the same underlying method
	// and previous test confirmed the logic is sound for both.
	test.expect(1);
	q([5, 6, 'grab some sticks'])
		.every(function(value) {
			return value == value*1;
		}, 'testEveryNamedQueue');
	q('testEveryNamedQueue')
		.each(function(result) {
			test.equal(false, result, 'every finds the string and barfs');
			test.done();
		});
};

exports.everySomeAnonQueue = function(test) {
	test.expect(1);
	q([7, 8, 'open the gate'])
		.some(function(value) {
			return value == value*1;
		})
		.each(function(result) {
			test.equal(true, result, 'some finds the first number');
			test.done();
		});
};

exports.flattenAndExec = function(test) {
	test.expect(1);
	q(['.'])
		.exec(fs.readdir, 'error')
		.flatten()
		.map(function(filename) {
			return ['./' + filename, 'utf8'];
		})
		.exec(fs.readFile)
		.reduce(function(concat, fileData) {
			return concat + fileData;
		}, function(result) {
			test.equal(typeof(result), 'string', 'all files concatenated properly');
			test.done();
		}, '');
	q('error')
		.each(function(errorOut) {
			test.ok(false, 'No error should have occurred');
			test.done();
		});
};

exports.namespaces = function(test) {
	test.expect(1);
	var foo = q.ns();
	var bar = q.ns();

	test.notStrictEqual(foo('baz'), bar('baz'), 'separate namespaces create separate Q instances with the same name');
	test.done();
};

exports.chain = function(test) {
	test.expect(1);
	q([1, 2, 3]).chain('foo');
	q('foo').toArray(function(array) {
		test.equal(array.toString(), [1, 2, 3].toString(), 'chain pushes the output into the defined queue');
		test.done();
	});
};

exports.each = function(test) {
	test.expect(5);
	var currVal = 0;
	q([1, 2, 3])
		.each(function(value) {
			test.ok(currVal < value, 'side-effect function received one of the values, in the proper order');
			currVal = value;
		})
		.toArray(function(array) {
			test.equal(array.toString(), [1, 2, 3].toString(), 'each passes the original data along');
			test.equal(3, currVal, 'and the side effect remains and at the proper value');
			test.done();
		});
};

exports.tuple = function(test) {
	test.expect(1);
	test.equal(q.tuple({
		a: 'b', c: 'd', e: 'f', g: 'h', i: 'j', k: 'l', m: 'n', o: 'p', q: 'r', s: 't', u: 'v', w: 'x', y: 'z'
	}).length, 13, 'tuple properly converts object into array of key-value tuples');
	test.done();
};

exports.syncExec = function(test) {
	test.expect(3);
	q([['foo', 'bar']])
		.exec(function(foo, bar) {
			if(foo == 'foo' && bar == 'bar') throw 'baz';
		}, 'syncError');
	q('syncError')
		.each(function(errorArr) {
			test.equal(errorArr[0], 'baz');
            test.equal(errorArr[1], undefined);
            test.equal(errorArr[2].toString(), 'foo,bar');
			test.done();
		});
};

exports.exists = function(test) {
    test.expect(2);
    q('exists');
    test.equal(q.exists('exists'), true, 'existing queue exists!');
    test.equal(q.exists('notExists'), false, 'notExisting queue does not exist!');
    test.done();
};
