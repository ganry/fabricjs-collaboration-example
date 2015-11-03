'use strict';

/**
 * Controllers
 */

angular.module('myApp.controllers', [])

/**
 * Main FabricJs Controller
 *
 * @TODO: Working with username is bad, replace with id
 */
.controller('HomeCtrl', function($scope, $location, commonData, socketFactory) {
    
    var homeCtrl = this;
    
    if (commonData.Name === '')
        $location.path('/');
    else
        socketFactory.emit('setUser', commonData.Name);
    
    
    /**
     * Get FabricJs Object by Id
     */
    homeCtrl.getObjectById = function(id) {
        
        for(var i = 0; i < $scope.objList.length; i++) {
            if ($scope.objList[i].id === id)
                return $scope.objList[i];
        }
        
    }
    
    /**
     * Simple canvas resize
     *
     * @TODO: Resize all FabricJs objects
     */
    homeCtrl.resizeCanvas = function (){ 
        
        $scope.canvas.setDimensions({
            width: $(homeCtrl.container).width(),
            height: $(homeCtrl.container).height()
        });

    }
    
    /**
     * Init Function
     *
     * @TODO: Load FabricJs objects from Server
     */
    homeCtrl.init = function() {

        // create a wrapper around native canvas element (with id="fabricjs")
        $scope.canvas = new fabric.Canvas('fabricjs');
        homeCtrl.container = $('#canvas-container');

        //Register resize event
        $(window).resize( homeCtrl.resizeCanvas );

        //Resize canvas on first load
        homeCtrl.resizeCanvas();
        
        //init objList
        $scope.objList = [
            new fabric.Rect({
                left: 100,
                top: 120,
                fill: '#2ecc71',
                width: 100,
                height: 100,
                originX: 'center',
                originY: 'center',
                id: '001'
            }),

            new fabric.Circle({
                left: 220,
                top: 120,
                fill: '#e74c3c',
                radius: 50,
                originX: 'center',
                originY: 'center',
                id: '002'
            }),
            
            new fabric.Triangle({
                left: 340,
                top: 120,
                fill: '#9b59b6',
                width: 100,
                height: 100,
                originX: 'center',
                originY: 'center',
                id: '003'
            }),
        ];
        
        //add all objects to the canvas
        $scope.objList.forEach(function(obj) {
            $scope.canvas.add(obj);
        });
        
        //add image from url
        fabric.Image.fromURL('images/icons/user.png', function(oImg) {
            oImg.id = '004';
            
            oImg.originX = 'center';
            oImg.originY = 'center';
            
            oImg.left = 460;
            oImg.top = 120;
            
            $scope.objList.push(oImg)
            $scope.canvas.add(oImg);
        });

        //register canvas events
        $scope.canvas.on('object:moving', this.emitObjectModifying);
        $scope.canvas.on('object:scaling', this.emitObjectModifying);
        $scope.canvas.on('object:rotating', this.emitObjectModifying);
        $scope.canvas.on('mouse:up', this.emitObjectStoppedModifying);
        
        //register socket events
        socketFactory.on('object:modifying', this.onObjectModifying);
        socketFactory.on('object:stoppedModifying', this.onObjectStoppedModifying);

        socketFactory.on('users', this.setUsers);
    };
    
    homeCtrl.setUsers = function(value) {
        $scope.users = value;
    }
    
    /**
     * Tell all clients we stopped modifying
     * 
     * @TODO: Working with username is bad, replace with id
     */
    homeCtrl.emitObjectStoppedModifying = function(event) {
        
        if (homeCtrl.isModifying) {
            socketFactory.emit('object:stoppedModifying', {
                username: commonData.Name
            });
        }
    };
    
    /**
     * Current Client is modifying object
     *
     * @TODO: Move boundary check to own function
     * @TODO: Check Boundary rect of object not object rect itself
     */
    homeCtrl.emitObjectModifying = function(event) {

        var activeObject = event.target,
            reachedLimit = false;
        

        if (activeObject.left < activeObject.width/2) {
            reachedLimit = true;
            activeObject.left = activeObject.width/2;
        }
        if (activeObject.left+activeObject.width/2 > $scope.canvas.width) {
            reachedLimit = true;
            activeObject.left = $scope.canvas.width-activeObject.width/2;
        }
        
        if (activeObject.top < activeObject.height/2) {
            reachedLimit = true;
            activeObject.top = activeObject.height/2;
        }
        if (activeObject.top+activeObject.height/2 > $scope.canvas.height) {
            reachedLimit = true;
            activeObject.top = $scope.canvas.height-activeObject.height/2;
        }
        
        if (reachedLimit) {
            activeObject.setCoords();
            $scope.canvas.renderAll();
        }
        
        if (typeof homeCtrl.currentMoveTimeout !== 'undefined')
            clearTimeout(homeCtrl.currentMoveTimeout);

        homeCtrl.currentMoveTimeout = setTimeout(function() {

            socketFactory.emit('object:modifying', {
                id: activeObject.id,
                left: activeObject.left,
                top: activeObject.top,
                scaleX: activeObject.scaleX,
                scaleY: activeObject.scaleY,
                angle: activeObject.angle,
                username: commonData.Name
            });
        }, 25);

        
    };
    
    /**
     * Object was modified by another client
     *
     * @TODO: Move editorBubble into own function
     */
    homeCtrl.onObjectModifying = function(value) {
        
        var obj = homeCtrl.getObjectById(value.id);
        
        if (typeof obj !== 'undefined') {
            
            obj.animate({
                left: value.left,
                top: value.top,
                scaleX: value.scaleX,
                scaleY: value.scaleY,
                angle: value.angle
            }, {
                duration: 500,
                onChange: function () {
                    obj.setCoords();
                    $scope.canvas.renderAll();

                    if ($('#editorBubble'+value.username).length == 0) {
                        $('#mainView').append('<div class="editorBubble" id="editorBubble'+value.username+'"></div>');
                    }

                    var editorBubble = $('#editorBubble'+value.username);

                    editorBubble.text(value.username);
                    editorBubble.css('left', $('#fabricjs').offset().left+obj.left-editorBubble.outerWidth() / 2);
                    editorBubble.css('top', $('#fabricjs').offset().top+obj.top-obj.height/2-editorBubble.outerHeight());

                    if (editorBubble.css('display') == 'none')
                        editorBubble.fadeIn(400);

                },
                onComplete: function () {
                    if ($('#editorBubble'+value.username).length > 0) {
                        $('#editorBubble'+value.username).fadeOut(400, function() {
                            $(this).remove();
                        });
                    }
                }
            });

        }

    };
    
    /**
     * Gets called after mouse is released on other client
     */
    homeCtrl.onObjectStoppedModifying = function(value) {
        
        if (typeof homeCtrl.currentMoveTimeout !== 'undefined') {
            clearTimeout(homeCtrl.currentMoveTimeout);
            homeCtrl.currentMoveTimeout = undefined;
        }

        
    };

    homeCtrl.init();

})

/**
 * Basic Profile Controller
 */
.controller('ProfileCtrl', function($scope, $location, commonData, socketFactory) {
    
    if (commonData.Name != '')
        $location.path('/fabric');
    
    $scope.submitName = function() {
        
        commonData.Name = $scope.user.name;
        $location.path('/fabric');
        
    };
});
