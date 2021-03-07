window.onload = function () {
    var app = new Vue({
        el: '#app',
        data: {
        }
    });
};

Vue.component('directory_open_modal', {
    data: function () {
        return {
            items: "",
            inputName: ""
        };
    },
    template: '<div class="modal fade" id="directoryOpenModal" tabindex="-1" role="dialog" aria-labelledby="directoryOpenModalLabel" aria-hidden="true">\
                    <div class= "modal-dialog" role="document" >\
                        <div class="modal-content">\
                            <div class="modal-header">\
                                <h5 class="modal-title">Open Directory</h5>\
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\
                                    <span aria-hidden="true">&times;</span>\
                                </button>\
                            </div>\
                            <div id="directoryOpener" class="modal-body">\
                                <p id="directoryOpenSelected" class="text-light"></p>\
                                <ul id="directoryOpenChoices" class="list-group">\
                                    <li v-for="(item, index) in items" class="list-group-item"  @click="browseToItem({item})" :key="`{{ item.id }}`"> {{ item.name }}</li>\
                                </ul>\
                            </div>\
                            <div class= "modal-footer">\
                                <button type="button" id="open-directory" @click="itemSelected(items)" class="btn btn-secondary" data-dismiss="modal">OK</button>\
                            </div>\
                        </div>\
                    </div>\
               </div>',
    mounted: function () {     
        var self = this;
    },
    methods: {
        browseToItem(args) {
            var self = this;
            var url = 'services/service?method=system.browse&location=' + encodeURIComponent(args.item.id);
            $.getJSON(url, function (data) {
                self.items = data;
            });
            $('#directoryOpenSelected').text(args.item.id);
        },

        itemSelected(items) {
            var self = this;
            var selectedDirectory = $('#directoryOpenSelected').text();
            $(self.inputName).val(selectedDirectory);
            $(self.inputName).trigger("change");
        },

        show(inputName, defaultDirectory) {
            var self = this;
            self.inputName = inputName;

            var url = 'services/service?method=system.browse';
            if (defaultDirectory != null)
                url += "&location=" + defaultDirectory;

            $.getJSON(url, function (data) {
                self.items = data;
            });

            $('#directoryOpenSelected').text(defaultDirectory);

            $('#directoryOpenModal').modal('show');
        }
    }
});
