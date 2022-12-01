const ArtifactBucketAside = {
    props: ['isInitDataFetched', 'selectedBucketRowIndex', 'selectedBucket', 'bucketCount'],
    data() {
        return {
            canSelectItems: false,
            loadingDelete: false,
            checkedBucketsList: [],
        }
    },
    computed: {
        isAnyBucketSelected() {
            return this.checkedBucketsList.length > 0;
        }
    },
    watch: {
        isInitDataFetched() {
            this.setBucketEvents();
        }
    },
    methods: {
        setBucketEvents() {
            const vm = this;
            $('#bucket-table').on('check.bs.table', (row, $element) => {
                this.checkedBucketsList.push($element.name);
            });
            $('#bucket-table').on('uncheck.bs.table', (row, $element) => {
                this.checkedBucketsList = this.checkedBucketsList.filter(bucket => {
                    return $element.name !== bucket
                })
            });
            $('#bucket-table').on('uncheck-all.bs.table', (row, $element) => {
                this.checkedBucketsList = [];
            });
            $('#bucket-table').on('check-all.bs.table', (rowsAfter, rowsBefore) => {
                this.checkedBucketsList = rowsBefore.map(row => row.name);
            });
            $('#bucket-table').on('sort.bs.table', function (name, order) {
                vm.$nextTick(() => {
                    $('#bucket-table').find(`[data-uniqueid='${vm.selectedBucket.id}']`).addClass('highlight');
                })
            });
        },
        switchSelectItems() {
            this.canSelectItems = !this.canSelectItems;
            const action = this.canSelectItems ? 'hideColumn' : 'showColumn';
            $('#bucket-table').bootstrapTable(action, 'select');
            document.getElementById("bucket-table")
                .rows[this.selectedBucketRowIndex + 1]
                .classList.add('highlight');
        },
    },
    template: `
        <aside class="m-3 card card-table-sm" style="width: 450px">
            <div class="row p-3">
                <div class="col-4">
                    <h4>Bucket</h4>
                </div>
                <div class="col-8">
                    <div class="d-flex justify-content-end">
                        <button type="button"
                             data-toggle="modal" 
                             data-target="#bucketModal"
                             class="btn btn-secondary btn-sm btn-icon__sm mr-2">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm btn-icon__sm mr-2"
                            @click="switchSelectItems">
                            <i class="icon__18x18 icon-multichoice"></i>
                        </button>
                        <button type="button" 
                            @click="$emit('open-confirm', 'multiple')"
                            :disabled="!isAnyBucketSelected"
                            class="btn btn-secondary btn-sm btn-icon__sm mr-2">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <table class="table table-borderless table-fix-thead"
                    id="bucket-table"
                    data-toggle="table"
                    data-unique-id="id"
                    data-sort-name="name" 
                    data-sort-order="asc"
                    data-pagination-pre-text="<img src='/design-system/static/assets/ico/arrow_left.svg'>"
                    data-pagination-next-text="<img src='/design-system/static/assets/ico/arrow_right.svg'>">
                    <thead class="thead-light">
                        <tr>
                            <th data-visible="false" data-field="id">index</th>
                            <th data-checkbox="true" data-field="select"></th>
                            <th scope="col" data-sortable="true" data-field="name" class="bucket-name">NAME</th>
                            <th scope="col" data-sortable="true" data-field="size" data-sorter="filesizeSorter" class="bucket-size">SIZE</th>
                            <th scope="col" data-cell-style="nameStyle"
                                data-formatter='<div class="d-none">
                                    <button class="btn btn-default btn-xs btn-table btn-icon__xs bucket_delete"><i class="fas fa-trash-alt"></i></button>
                                    <button class="btn btn-default btn-xs btn-table btn-icon__xs bucket_setting"><i class="fas fa-gear"></i></button>
                                </div>'
                                data-events="bucketEvents">
                            </th>
                        </tr>
                    </thead>
                    <tbody style="height: 315px">
                    </tbody>
                </table>
                <div class="p-3">
                    <span class="font-h5 text-gray-600">{{ bucketCount }} items</span>
                </div>
            </div>
        </aside>
    `
}

var bucketEvents = {
    "click .bucket_delete": function (e, value, row, index) {
        e.stopPropagation();
        const vm = vueVm.registered_components.artifact
        vm.openConfirm('single');
    },
    "click .bucket_setting": function (e, value, row, index) {
        e.stopPropagation();
        $('#bucketUpdateModal').modal('show');
    }
}

function filesizeSorter(a, b) {
    let a_number = retnum(a);
    let b_number = retnum(b);
    a = a_number;
    b = b_number;
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
}

function retnum(number) {
    let num = number.replace(/[^0-9]/g, '');
    const fileSizeName = number.replace(/[^a-zA-Z]+/g, '').toUpperCase();

    num = parseInt(num, 10);

    switch (fileSizeName) {
        case "K":
            num = num * 1024;
            break;
        case "M":
            num = num * Math.pow(1024, 2);
            break;
        case "G":
            num = num * Math.pow(1024, 3);
            break;
        case "T":
            num = num * Math.pow(1024, 4);
            break;
    }

    return num;
}