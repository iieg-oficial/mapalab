.PHONY: setup-hooks refresh-layer-tree

##@ MapaLab

setup-hooks: ## Configurar los git hooks del proyecto
	@$(LIB)
	git config core.hooksPath .githooks

refresh-layer-tree: ## Regenerar el cache del arbol de capas
	@$(LIB)
	banner 'REFRESH' 'layer tree'
	rule
	refresh_layer_tree
