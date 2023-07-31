<script setup>
import { ref, onMounted} from 'vue';
import { useConfirm } from "primevue/useconfirm";
import { useRoute } from 'vue-router';
import ClipboardJS from 'clipboard';
import FileUploadv2 from './FileUploadv2.vue';
import DataTable from './datatable/DataTable.vue'
import Image from './Image/Image.vue'
import router from '../router'
import ProgressBar from 'primevue/progressbar';

const use_route = useRoute();
const page_params = use_route.params;
const main_link = page_params.id
const absolute_url = new URL(window.location.origin).href;
const upload_url = `${absolute_url}upload?main_link=${main_link}`;

const confirm = useConfirm();

let selectedFiles = ref([]);
let select_all = ref(null);

let trash_button_status = ref(true);

let progressMain = ref(null);

async function handleDownloadButton() {
  if (selectedFiles.value.length == 0) {
    select_all.value = true;
    setTimeout(function () {
      select_all.value = null;
    }, 1000);
  }
  let data;

  if (selectedFiles.value.length == 0) {
    data = JSON.stringify(list_of_files.value.data.documents);
  } else {
    data = JSON.stringify(selectedFiles.value);
  }
  const response_from_server = await fetch(`/download?main_link=${main_link}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data })
  if (response_from_server.status !== 200) return console.log('error', response_from_server)
  const content_disposition = response_from_server.headers.get('Content-Disposition');
  const file_name = content_disposition.match(/filename="(.+)"/)[1];
  const blob = await response_from_server.blob();
  const file_url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = file_url;
  a.download = file_name;
  document.body.appendChild(a);
  a.click();
}

function updateSelection() {
  if (select_all.value == null) {
    if (selectedFiles.value.length > 0) {
      trash_button_status.value = false;
    } else {
      trash_button_status.value = true;
    }
  }
}

class Files {
  async getFiles() {
    setTimeout(async function () {
      const response_from_server = await fetch(`/files?main_link=${main_link}`, { method: 'GET' });
      if (response_from_server.status !== 200) {
        router.push(`/notfound`);
      }
      list_of_files.value = await response_from_server.json();
    }, 100)
    /**
     * { 
     *  data: {
     *    main_link: word-1234,
     *    created_at: ISO date
     *    total_files: number   
     *    documents: []
     *  }
     * }
    */
  }
};
const files = ref(new Files());
const list_of_files = ref([]);


onMounted(() => {
  files.value.getFiles();
  //https://clipboardjs.com/
  var clipboard = new ClipboardJS('.btn-clipboard');
  clipboard.on('success', function (e) {
    e.trigger.classList.add('p-button-success');
    e.clearSelection();
  });
  clipboard.on('error', function (e) {
    e.trigger.classList.add('p-button-danger');
    e.clearSelection();
  });

});

function formatBytes(bytes, decimals = 0) {
  // from https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
};

function onTemplatedUpload(event) {
  const response_status = event['xhr'].status || 400;
  if (response_status == 200) {
    const response = JSON.parse(event['xhr'].response);
    try {
      list_of_files.value.data.documents = list_of_files.value.data.documents.concat(response.data);
      progressMain.value = null;
    } catch (err) {
      console.error(err);
    }
  }
}
async function onCellEditComplete(event) {
  let { data, newValue, field } = event;
  if (data.name == newValue) {
    return;
  }
  const file_edited = {
    main_link: main_link,
    unique_name: data.unique_name,
    field: field,
    new_name: newValue,
  };
  const queryString = new URLSearchParams(file_edited).toString();
  const response_from_server = await fetch(`/edit?${queryString}`, { method: 'POST' });
  const response_json = await response_from_server.json();
  if (response_json.data == 'sucess') {
    data[field] = newValue;
  } else {
    event.preventDefault();
  }
};
function deleteFile(event) {
  confirm.require({
    target: event.currentTarget,
    message: 'Are you sure you want to proceed?',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const queryString = new URLSearchParams(selectedFiles.value.map(s => ['unique_name', s.unique_name]))
      const response_from_server = await fetch(`/delete?main_link=${main_link}&${queryString}`, { method: 'DELETE' });
      const response_json = await response_from_server.json();
      if (response_from_server.status == 200) {
        if (response_json.data == 'all removed') {
          return router.push('/notfound');
        }
        response_json.data.forEach(ele => {
          const index = list_of_files.value.data.documents.findIndex(item => item.unique_name == ele.unique_name)
          list_of_files.value.data.documents.splice(index, 1);
          selectedFiles.value = [];
        });
        trash_button_status.value = true;
      }
    },
    reject: () => {
    }
  })

}
function isImage(mimetype) {
  return mimetype.startsWith('image/');
}
function iconType(filetype) {
  const availableTypes = {
    "application/pdf": "pi-file-pdf",
    "text/plain": "pi-file-edit",
    "application/vnd.ms-excel": "pi-file-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "pi-file-excel",
    "application/msword": "pi-file-word",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "pi-file-word",
    "video/x-msvideo": "pi-video",
    "video/mp4": "pi-video",
    "video/mpeg": "pi-video",
    "video/webm": "pi-video",
    "application/json": "pi-code",
    "application/ld+json": "pi-code",
    "default": "pi-file"
  }
  return availableTypes[filetype] || availableTypes['default'];
}
function progressFunc(event) {
  progressMain.value = event.progress;
  // console.log('1', event.progress);
  // if ( event.progress == 100) {
  //   progressMain.value = null;
  // }
}
</script>

<template>
  <div>
    <div v-if="list_of_files && list_of_files.data" class="wrapper-main">
      <Toolbar class="mb-2">
        <template #start>
          <FileUploadv2 mode="basic" name="client_files" :multiple="true" class="mr-2" :url="upload_url" :auto="true"
            chooseLabel="Add" uploadIcon="pi pi-plus" @upload="onTemplatedUpload($event)"  @progress="progressFunc"/>
          <Button label="Download" icon="pi pi-download" class="mr-2" @click="handleDownloadButton" />
          <ConfirmPopup></ConfirmPopup>
          <Button label="Delete" icon="pi pi-trash" :disabled="trash_button_status" @click="deleteFile($event)" />
        </template>
        <template #end>
          <div class="p-inputgroup">
            <Button label="Copy!" class="btn-clipboard" data-clipboard-target="#id-clipboard" />
            <InputText v-if="list_of_files && list_of_files.data" id="id-clipboard" type="text"
            :value="absolute_url + list_of_files.data.main_link" />
          </div>
        </template>
      </Toolbar>
      <ProgressBar  v-if="progressMain !== null" :value="progressMain" :showValue="false" style="height: .2em" />
      <div v-else style="background-color: #dee2e6; height: .2em;"></div>
      <DataTable responsiveLayout="scroll" stripedRows dataKey="unique_name" editMode="cell"
        v-model:selection="selectedFiles" @update:selection="updateSelection" :value="list_of_files.data.documents"
        :selectAllCheckboxD="select_all" @cell-edit-complete="onCellEditComplete">
        <Column selectionMode="multiple" headerStyle="width: 3em"></Column>

        <Column header="Image" class="cell-image">
          <template #body="slotProps">
            <Image v-if="isImage(slotProps.data.mimetype)" :src="absolute_url + 'images/' + slotProps.data.unique_name"
              :thumbSrc="absolute_url + 'images/' + slotProps.data.unique_name + '_small'" alt="not rendered" width="40" preview onerror="reloadImage(this)" />
            <i v-else class="pi" :class="iconType(slotProps.data.mimetype)" style="font-size:40px"></i>
          </template>
        </Column>

        <Column field="name" header="Name" class="check-me">
          <template #editor="{ data, field }">
            <InputText v-model="data[field]" autofocus />
          </template>
          <template #body="slotProps">
            <span class="image-text">{{ slotProps.data.name }}&nbsp;</span>
            <i class="hide-pencil pi pi-pencil"></i>
          </template>
        </Column>

        <Column field="file_extension" header="Extention"></Column>
        <Column field="size" header="Size">
          <template #body="slotProps">
            {{ formatBytes(slotProps.data.size) }}
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
<style >
.cell-image {
  position: relative;
  width: 60px;
}

.cell-image>span {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  height: 40px;
  width: 40px;
}

.check-me>.hide-pencil {
  display: none;
}

.check-me:hover>.hide-pencil {
  display: inline-block;
  position: absolute;
}

/* .hide-pencil:hover {
} */
.p-toolbar-group-right {
  min-width: 40%;
}

.mr-2 {
  margin-right: .5rem !important;
}

.mb-2 {
  margin-bottom: .5rem !important;
}
</style>