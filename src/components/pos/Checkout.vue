<template>
<!-- Button -->
<div class="col-md-6">
    <div class="list-group">
        <button type="button" class="list-group-item item" data-toggle="modal" data-target="#exampleModal">
            <strong>Checkout</strong>
        </button>
    </div>
</div>

<input v-model="cash">
<input v-model="cheque">
<input v-model="outstanding">

<!-- Modal -->
<div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLabel">Modal title</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        ...
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">Save changes</button>
      </div>
    </div>
  </div>
</div>
</template>


<script>
export default {
    data: {
        cash: 0,
        cheque: 0,
        outstanding: 0
    },
    computed: {
        outstandingAmount(){
            outstanding =  grandTotal - cash - cheque
        }
    }
}
</script>
