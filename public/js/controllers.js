'use strict';

/**
 * Controllers
 */

angular.module('fabricApp.controllers', [])

/**
 * Main FabricJs Controller
 *
 * @TODO: Working with username is bad, replace with id
 */
.controller('HomeCtrl', function($scope, $location, commonData, socketFactory) {
    
    var homeCtrl = this;
    
    if (commonData.Name === '') {
        $location.path('/');
        return;
    }
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
     * Resize Canvas
     *
     * @TODO: Replace static optimal width with constant
     */
    homeCtrl.resizeCanvas = function (){ 
        
        var minWidth = 480;
        var containerWidth = $(homeCtrl.container).width() > minWidth ? $(homeCtrl.container).width() : minWidth;
        var scaleFactor = containerWidth / 847;

        $scope.canvas.setDimensions({
            width: containerWidth
        });

        $scope.canvas.setZoom(scaleFactor);
        $scope.canvas.calcOffset();
        $scope.canvas.renderAll();

    }
    
    /**
     * Init Function
     *
     * @TODO: Load FabricJs objects from Server
     */
    homeCtrl.init = function() {

        // create a wrapper around native canvas element (with id="fabricjs")
        $scope.canvas = new fabric.Canvas('fabricjs');
        $scope.canvas.selection = false;
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
            new fabric.Text('Everything Responsive', {
                left: 300, 
                top: 300,
                fill: '#f39c12',
                fontFamily: 'Oxygen',
                originX: 'center',
                originY: 'center',
                id: '005'
            })
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
    };
    
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
     * @TODO: Move boundary check to seperate function
     */
    homeCtrl.emitObjectModifying = function(event) {
        
        homeCtrl.isModifying = true;
        
        var activeObject = event.target,
            reachedLimit = false,
            
            objectLeft = activeObject.left,
            objectTop = activeObject.top,
            objectWidth = (activeObject.width * activeObject.scaleX) / 2 ,
            objectHeight = (activeObject.height * activeObject.scaleY) / 2,
            canvasWidth = $scope.canvas.width/$scope.canvas.getZoom(),
            canvasHeight = $scope.canvas.height/$scope.canvas.getZoom();

        if (objectLeft < objectWidth) {
            reachedLimit = true;
            activeObject.left = objectWidth;
        }
        if (objectLeft+objectWidth > canvasWidth) {
            reachedLimit = true;
            activeObject.left = canvasWidth-objectWidth;
        }
        
        if (objectTop < objectHeight) {
            reachedLimit = true;
            activeObject.top = objectHeight;
        }
        if (objectTop+objectHeight > canvasHeight) {
            reachedLimit = true;
            activeObject.top = canvasHeight-objectHeight;
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
        var editorBubble = $('#editorBubble'+value.username);

        if (editorBubble.css('display') == 'none')
            editorBubble.fadeIn(400);
        
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

                    var editorBubble = $('#editorBubble'+value.username),
                        objectLeft = obj.left * $scope.canvas.getZoom(),
                        objectTop = obj.top * $scope.canvas.getZoom(),
                        objectHeight = (obj.height * obj.scaleY * $scope.canvas.getZoom()) / 2;


                    editorBubble.text(value.username);
                    editorBubble.css('left', $('#fabricjs').offset().left+objectLeft-editorBubble.outerWidth() / 2);
                    editorBubble.css('top', $('#fabricjs').offset().top+objectTop-objectHeight-editorBubble.outerHeight());
                },
                onComplete: function () {
                    
                }
            });

        }

    };
    
    /**
     * Gets called after mouse is released on other client
     */
    homeCtrl.onObjectStoppedModifying = function(value) {
        
        homeCtrl.isModifying = false;
        
        if (typeof homeCtrl.currentMoveTimeout !== 'undefined') {
            clearTimeout(homeCtrl.currentMoveTimeout);
            homeCtrl.currentMoveTimeout = undefined;
        }
        
        
        if ($('#editorBubble'+value.username).length > 0) {
            $('#editorBubble'+value.username).fadeOut(400, function() {
                $(this).remove();
            });
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
