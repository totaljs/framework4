exports.install = function() {
    F.route('/package/', function() {
        this.view('@testpackage/test');
    })
};