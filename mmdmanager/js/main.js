//Vue相关
router = new VueRouter({
	routes:routes,
});
window.app = new Vue({
	el:'#app',
	store,
	router:router,
	methods:{
        open(e) {
			e.preventDefault();
			$('#dropButton').click()
			console.log(e.dataTransfer.files)
			this.$alert('这是一段内容', '标题名称', {
			  	confirmButtonText: '确定',
			})
		}
	}
});
hulla = new hullabaloo();
window.ondragover = function(e) {
	e.preventDefault();
	return false
};
window.ondrop = function(e) {
	e.preventDefault();
	console.log(e.dataTransfer.files)
	return false
}