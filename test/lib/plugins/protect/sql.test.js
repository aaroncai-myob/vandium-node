'use strict';

/*jshint expr: true*/

const expect = require( 'chai' ).expect;

const sinon = require( 'sinon' );

const ScanEngine = require( '../../../../lib/plugins/protect/scan_engine' );

const sql = require( '../../../../lib/plugins/protect/sql' );

xdescribe( 'lib/plugins/protect/sql', function() {

    describe( 'SQLScanEngine', function() {

        describe( 'constructor', function() {

            it( 'singleton', function() {

                expect( sql ).to.be.instanceof( ScanEngine );
            });
        });

        describe( '.scan', function() {

            beforeEach( function() {

                sql.fail();
            });

            it( 'test normal values', function() {

                var event = {

                    string1: "what's up",
                    string2: "double -- dash",
                    string3: "a union between code",
                    string4: "this sentence has union and the word select",
                    number: 1234,
                    object: { number: 123 },
                    bool: true
                };

                sql.scan( event );
            });

            it( 'regression false positive tests', function() {

                var event = {

                    escapeComment1: "/details?seoName=smith---whatever-main-office"
                };

                sql.scan( event );
            });

            [
                [ "admin' --", 'ESCAPED_COMMENT' ],
                [ "admin'--", 'ESCAPED_COMMENT' ],
                [ "1' or 1=1;drop table user;", 'ESCAPED_OR' ],
                [ "1' and 1=1;drop table user;", 'ESCAPED_AND' ],
                [ "1=1'; drop table user;--", 'EQUALS_WITH_COMMENT' ],
                [ "1';drop table user;", 'ESCAPED_SEMICOLON' ],
                [ "x' AND 1=(SELECT COUNT(*) FROM tabname); --", 'ESCAPED_AND' ],
                [ "1' union all select name from users where name is not null", 'ESCAPED_UNION' ],
                [ "' union all select name from users where name is not null", 'ESCAPED_UNION' ],
            ].forEach( function( test ) {

                it( 'fail: ' + test[1], function() {

                    sql.fail();

                    var event = {

                        myField: test[0],
                        other: 'my other field'
                    };

                    try {

                        sql.scan( event );

                        throw new Error( 'should never get here' );
                    }
                    catch( err ) {

                        expect( err.message ).to.equal( 'myField is invalid' );
                        expect( err.attackType ).to.equal( test[1] );
                    }
                });

                it( 'fail: nested case - ' + test[1], function() {

                    sql.fail();

                    var event = {

                        update: {
                            myField: test[0],
                        },
                        other: 'my other field'
                    };

                    try {

                        sql.scan( event );

                        throw new Error( 'should never get here' );
                    }
                    catch( err ) {

                        expect( err.message ).to.equal( 'myField is invalid' );
                        expect( err.attackType ).to.equal( test[1] );
                    }
                });

                it( 'fail: ' + test[1] + ' - report only', function() {

                    sql.report();

                    var event = {

                        myField: test[0],
                        other: 'my other field'
                    };

                    sql.scan( event );
                });
            });
        });
    });
});
