import re
import copy
import time
import random

FILES = "ABCDEFGH"
RANKS = "12345678"
POS_RE = re.compile(r"^([A-H])([1-8])$")

WHITE, BLACK = "_W", "_B"
PIECE_VALUES = {"P": 100, "N": 320, "B": 330, "R": 500, "Q": 900, "K": 20000}

# Positional bonus tables
PAWN_TABLE = [
    [  0,  0,  0,  0,  0,  0,  0,  0],
    [ 50, 50, 50, 50, 50, 50, 50, 50],
    [ 10, 10, 20, 30, 30, 20, 10, 10],
    [  5,  5, 10, 25, 25, 10,  5,  5],
    [  0,  0,  0, 20, 20,  0,  0,  0],
    [  5, -5,-10,  0,  0,-10, -5,  5],
    [  5, 10, 10,-20,-20, 10, 10,  5],
    [  0,  0,  0,  0,  0,  0,  0,  0]
]

KNIGHT_TABLE = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
]

BISHOP_TABLE = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
]

KING_MIDDLEGAME_TABLE = [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [ 20, 20,  0,  0,  0,  0, 20, 20],
    [ 20, 30, 10,  0,  0, 10, 30, 20]
]

class Piece:
    def __init__(self, pid, ptype, side, x, y):
        self.id = pid      
        self.ptype = ptype 
        self.side = side   
        self.x, self.y = x, y
        self.alive = True
        self.moved = False  

    def pos(self):
        return (self.x, self.y)

    def copy(self):
        new_piece = Piece(self.id, self.ptype, self.side, self.x, self.y)
        new_piece.alive = self.alive
        new_piece.moved = self.moved
        return new_piece

class GameState:
    def __init__(self):
        self.castling_rights = {"K_W": True, "Q_W": True, "K_B": True, "Q_B": True}
        self.en_passant_target = None  
        self.halfmove_clock = 0  
        self.fullmove_number = 1
        self.move_history = []  

class ChessBot:
    def __init__(self, side, difficulty=3):
        self.side = side
        self.difficulty = difficulty  # Search depth
        self.name = "ChessBot AI"
        
    def think_and_move(self, game):
        """AI makes a move using minimax with alpha-beta pruning"""
        print(f"\n{self.name}: Let me think...")
        start_time = time.time()
        
        best_move = self.get_best_move(game)
        
        think_time = time.time() - start_time
        print(f"{self.name}: I'll move {best_move[0]} to {game.square_to_str(*best_move[1])} (thought for {think_time:.1f}s)")
        
        # Execute the move
        piece = game.pieces[best_move[0]]
        game.move(best_move[0], game.square_to_str(*best_move[1]))
        
    def get_best_move(self, game):
        """Find the best move using minimax with alpha-beta pruning"""
        best_move = None
        best_score = float('-inf') if self.side == game.to_move else float('inf')
        
        all_moves = []
        for pid, piece in game.pieces.items():
            if piece.alive and piece.side == self.side:
                moves = game.legal_moves(piece)
                for move in moves:
                    all_moves.append((pid, move))
        
        # Order moves for better alpha-beta pruning
        all_moves = self.order_moves(game, all_moves)
        
        alpha = float('-inf')
        beta = float('inf')
        
        for pid, move in all_moves:
            # Make a copy and try the move
            game_copy = self.copy_game(game)
            piece_copy = game_copy.pieces[pid]
            
            # Execute move on copy
            success = self.execute_move_on_copy(game_copy, piece_copy, move)
            if not success:
                continue
                
            game_copy.to_move = BLACK if game_copy.to_move == WHITE else WHITE
            
            score = self.minimax(game_copy, self.difficulty - 1, alpha, beta, 
                                self.side != game_copy.to_move)
            
            if self.side == game.to_move:  # Maximizing
                if score > best_score:
                    best_score = score
                    best_move = (pid, move)
                alpha = max(alpha, score)
            else:  # Minimizing
                if score < best_score:
                    best_score = score
                    best_move = (pid, move)
                beta = min(beta, score)
                
            if beta <= alpha:
                break
                
        return best_move if best_move else (all_moves[0] if all_moves else None)
    
    def minimax(self, game, depth, alpha, beta, maximizing):
        """Minimax algorithm with alpha-beta pruning"""
        if depth == 0 or game.game_over:
            return self.evaluate_position(game)
            
        if maximizing:
            max_eval = float('-inf')
            for pid, piece in game.pieces.items():
                if piece.alive and piece.side == game.to_move:
                    moves = game.legal_moves(piece)
                    for move in moves:
                        game_copy = self.copy_game(game)
                        piece_copy = game_copy.pieces[pid]
                        
                        if self.execute_move_on_copy(game_copy, piece_copy, move):
                            game_copy.to_move = BLACK if game_copy.to_move == WHITE else WHITE
                            eval_score = self.minimax(game_copy, depth - 1, alpha, beta, False)
                            max_eval = max(max_eval, eval_score)
                            alpha = max(alpha, eval_score)
                            if beta <= alpha:
                                break
                    if beta <= alpha:
                        break
            return max_eval
        else:
            min_eval = float('inf')
            for pid, piece in game.pieces.items():
                if piece.alive and piece.side == game.to_move:
                    moves = game.legal_moves(piece)
                    for move in moves:
                        game_copy = self.copy_game(game)
                        piece_copy = game_copy.pieces[pid]
                        
                        if self.execute_move_on_copy(game_copy, piece_copy, move):
                            game_copy.to_move = BLACK if game_copy.to_move == WHITE else WHITE
                            eval_score = self.minimax(game_copy, depth - 1, alpha, beta, True)
                            min_eval = min(min_eval, eval_score)
                            beta = min(beta, eval_score)
                            if beta <= alpha:
                                break
                    if beta <= alpha:
                        break
            return min_eval
    
    def evaluate_position(self, game):
        """Advanced position evaluation function"""
        if game.game_over:
            if game.winner == self.side:
                return 10000
            elif game.winner is None:
                return 0
            else:
                return -10000
                
        score = 0
        
        # Material and positional values
        for piece in game.pieces.values():
            if not piece.alive:
                continue
                
            piece_value = PIECE_VALUES[piece.ptype]
            
            # Positional bonus
            x, y = piece.x, piece.y
            if piece.side == BLACK:
                y = 7 - y  # Flip for black pieces
                
            if piece.ptype == "P":
                piece_value += PAWN_TABLE[y][x]
            elif piece.ptype == "N":
                piece_value += KNIGHT_TABLE[y][x]
            elif piece.ptype == "B":
                piece_value += BISHOP_TABLE[y][x]
            elif piece.ptype == "K":
                piece_value += KING_MIDDLEGAME_TABLE[y][x]
                
            # Add mobility bonus
            mobility = len(game.legal_moves(piece))
            piece_value += mobility * 2
            
            if piece.side == self.side:
                score += piece_value
            else:
                score -= piece_value
        
        # Center control bonus
        center_squares = [(3,3), (3,4), (4,3), (4,4)]
        for x, y in center_squares:
            if game.board[x][y]:
                piece = game.pieces[game.board[x][y]]
                if piece.side == self.side:
                    score += 10
                else:
                    score -= 10
        
        # King safety
        if game.is_in_check(self.side):
            score -= 50
        enemy_side = BLACK if self.side == WHITE else WHITE
        if game.is_in_check(enemy_side):
            score += 50
            
        return score
    
    def order_moves(self, game, moves):
        """Order moves for better alpha-beta pruning"""
        def move_priority(move):
            pid, target = move
            priority = 0
            
            # Prioritize captures
            if game.board[target[0]][target[1]]:
                captured = game.pieces[game.board[target[0]][target[1]]]
                priority += PIECE_VALUES[captured.ptype]
                
            # Prioritize center moves
            center_dist = abs(target[0] - 3.5) + abs(target[1] - 3.5)
            priority -= center_dist
            
            return priority
            
        return sorted(moves, key=move_priority, reverse=True)
    
    def copy_game(self, game):
        """Create a deep copy of the game state"""
        new_game = ChessGame()
        new_game.board = copy.deepcopy(game.board)
        new_game.pieces = {}
        for pid, piece in game.pieces.items():
            new_game.pieces[pid] = piece.copy()
        new_game.to_move = game.to_move
        new_game.game_state = copy.deepcopy(game.game_state)
        new_game.game_over = game.game_over
        new_game.winner = game.winner
        return new_game
    
    def execute_move_on_copy(self, game_copy, piece, target):
        """Execute a move on a game copy"""
        return game_copy.execute_move_internal(piece, target)

class ChessGame:
    def __init__(self, vs_ai=False, player_side=WHITE, ai_difficulty=3):
        self.board = [[None for _ in range(8)] for _ in range(8)]
        self.pieces = {}
        self.to_move = WHITE
        self.game_state = GameState()
        self.game_over = False
        self.winner = None
        self.vs_ai = vs_ai
        self.ai_bot = None
        if vs_ai:
            ai_side = BLACK if player_side == WHITE else WHITE
            self.ai_bot = ChessBot(ai_side, ai_difficulty)
            print(f"\n🤖 {self.ai_bot.name}: Hello! I'll be playing as {'White' if ai_side == WHITE else 'Black'}.")
            print(f"🤖 {self.ai_bot.name}: I'm set to difficulty level {ai_difficulty}. Good luck!")
        self.init_board()

    def init_board(self):
        # Place pawns
        for i in range(8):
            self.add(Piece(f"P{i+1}_W", "P", WHITE, i, 1))
            self.add(Piece(f"P{i+1}_B", "P", BLACK, i, 6))
        # Rooks
        self.add(Piece("R1_W", "R", WHITE, 0, 0))
        self.add(Piece("R2_W", "R", WHITE, 7, 0))
        self.add(Piece("R1_B", "R", BLACK, 0, 7))
        self.add(Piece("R2_B", "R", BLACK, 7, 7))
        # Knights
        self.add(Piece("N1_W", "N", WHITE, 1, 0))
        self.add(Piece("N2_W", "N", WHITE, 6, 0))
        self.add(Piece("N1_B", "N", BLACK, 1, 7))
        self.add(Piece("N2_B", "N", BLACK, 6, 7))
        # Bishops
        self.add(Piece("B1_W", "B", WHITE, 2, 0))
        self.add(Piece("B2_W", "B", WHITE, 5, 0))
        self.add(Piece("B1_B", "B", BLACK, 2, 7))
        self.add(Piece("B2_B", "B", BLACK, 5, 7))
        # Queens
        self.add(Piece("Q_W", "Q", WHITE, 3, 0))
        self.add(Piece("Q_B", "Q", BLACK, 3, 7))
        # Kings
        self.add(Piece("K_W", "K", WHITE, 4, 0))
        self.add(Piece("K_B", "K", BLACK, 4, 7))

    def add(self, piece):
        self.pieces[piece.id] = piece
        self.board[piece.x][piece.y] = piece.id

    def parse_square(self, s):
        s = s.strip().upper()
        m = POS_RE.match(s)
        if not m: return None
        x = FILES.index(m.group(1))
        y = RANKS.index(m.group(2))
        return (x, y)

    def square_to_str(self, x, y):
        return f"{FILES[x]}{RANKS[y]}"

    def get_piece_at(self, x, y):
        if 0 <= x < 8 and 0 <= y < 8 and self.board[x][y]:
            return self.pieces[self.board[x][y]]
        return None

    def is_square_attacked(self, x, y, by_side):
        """Check if a square is attacked by pieces of given side"""
        for pid, piece in self.pieces.items():
            if piece.alive and piece.side == by_side:
                attacks = self.get_piece_attacks(piece)
                if (x, y) in attacks:
                    return True
        return False

    def get_piece_attacks(self, piece):
        """Get squares attacked by a piece (not necessarily legal moves)"""
        attacks = []
        x, y = piece.x, piece.y
        
        if piece.ptype == "P":
            dy = 1 if piece.side == WHITE else -1
            for dx in [-1, 1]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < 8 and 0 <= ny < 8:
                    attacks.append((nx, ny))
                    
        elif piece.ptype == "R":
            directions = [(1,0), (-1,0), (0,1), (0,-1)]
            for dx, dy in directions:
                nx, ny = x + dx, y + dy
                while 0 <= nx < 8 and 0 <= ny < 8:
                    attacks.append((nx, ny))
                    if self.board[nx][ny]:
                        break
                    nx += dx
                    ny += dy
                    
        elif piece.ptype == "N":
            knight_moves = [(2,1), (2,-1), (-2,1), (-2,-1), (1,2), (1,-2), (-1,2), (-1,-2)]
            for dx, dy in knight_moves:
                nx, ny = x + dx, y + dy
                if 0 <= nx < 8 and 0 <= ny < 8:
                    attacks.append((nx, ny))
                    
        elif piece.ptype == "B":
            directions = [(1,1), (1,-1), (-1,1), (-1,-1)]
            for dx, dy in directions:
                nx, ny = x + dx, y + dy
                while 0 <= nx < 8 and 0 <= ny < 8:
                    attacks.append((nx, ny))
                    if self.board[nx][ny]:
                        break
                    nx += dx
                    ny += dy
                    
        elif piece.ptype == "Q":
            directions = [(1,0), (-1,0), (0,1), (0,-1), (1,1), (1,-1), (-1,1), (-1,-1)]
            for dx, dy in directions:
                nx, ny = x + dx, y + dy
                while 0 <= nx < 8 and 0 <= ny < 8:
                    attacks.append((nx, ny))
                    if self.board[nx][ny]:
                        break
                    nx += dx
                    ny += dy
                    
        elif piece.ptype == "K":
            king_moves = [(1,0), (-1,0), (0,1), (0,-1), (1,1), (1,-1), (-1,1), (-1,-1)]
            for dx, dy in king_moves:
                nx, ny = x + dx, y + dy
                if 0 <= nx < 8 and 0 <= ny < 8:
                    attacks.append((nx, ny))
                    
        return attacks

    def is_in_check(self, side):
        """Check if the king of given side is in check"""
        king_id = f"K{side}"
        if king_id not in self.pieces or not self.pieces[king_id].alive:
            return False
        king = self.pieces[king_id]
        enemy_side = BLACK if side == WHITE else WHITE
        return self.is_square_attacked(king.x, king.y, enemy_side)

    def legal_moves(self, piece):
        """Get all legal moves for a piece"""
        if not piece.alive:
            return []
            
        pseudo_moves = self.get_pseudo_legal_moves(piece)
        legal_moves = []
        
        for move in pseudo_moves:
            if self.is_legal_move(piece, move):
                legal_moves.append(move)
                
        return legal_moves

    def get_pseudo_legal_moves(self, piece):
        """Get pseudo-legal moves (ignoring check)"""
        moves = []
        x, y = piece.x, piece.y
        
        if piece.ptype == "P":
            dy = 1 if piece.side == WHITE else -1
            
            # Forward move
            nx, ny = x, y + dy
            if 0 <= ny < 8 and not self.board[nx][ny]:
                moves.append((nx, ny))
                
                # Double move from starting position
                if not piece.moved:
                    nx2, ny2 = x, y + 2*dy
                    if 0 <= ny2 < 8 and not self.board[nx2][ny2]:
                        moves.append((nx2, ny2))
            
            # Captures
            for dx in [-1, 1]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < 8 and 0 <= ny < 8:
                    target_piece = self.get_piece_at(nx, ny)
                    if target_piece and target_piece.side != piece.side:
                        moves.append((nx, ny))
                    # En passant
                    elif self.game_state.en_passant_target == (nx, ny):
                        moves.append((nx, ny))
                        
        elif piece.ptype == "R":
            directions = [(1,0), (-1,0), (0,1), (0,-1)]
            for dx, dy in directions:
                nx, ny = x + dx, y + dy
                while 0 <= nx < 8 and 0 <= ny < 8:
                    target_piece = self.get_piece_at(nx, ny)
                    if not target_piece:
                        moves.append((nx, ny))
                    else:
                        if target_piece.side != piece.side:
                            moves.append((nx, ny))
                        break
                    nx += dx
                    ny += dy
                    
        elif piece.ptype == "N":
            knight_moves = [(2,1), (2,-1), (-2,1), (-2,-1), (1,2), (1,-2), (-1,2), (-1,-2)]
            for dx, dy in knight_moves:
                nx, ny = x + dx, y + dy
                if 0 <= nx < 8 and 0 <= ny < 8:
                    target_piece = self.get_piece_at(nx, ny)
                    if not target_piece or target_piece.side != piece.side:
                        moves.append((nx, ny))
                        
        elif piece.ptype == "B":
            directions = [(1,1), (1,-1), (-1,1), (-1,-1)]
            for dx, dy in directions:
                nx, ny = x + dx, y + dy
                while 0 <= nx < 8 and 0 <= ny < 8:
                    target_piece = self.get_piece_at(nx, ny)
                    if not target_piece:
                        moves.append((nx, ny))
                    else:
                        if target_piece.side != piece.side:
                            moves.append((nx, ny))
                        break
                    nx += dx
                    ny += dy
                    
        elif piece.ptype == "Q":
            directions = [(1,0), (-1,0), (0,1), (0,-1), (1,1), (1,-1), (-1,1), (-1,-1)]
            for dx, dy in directions:
                nx, ny = x + dx, y + dy
                while 0 <= nx < 8 and 0 <= ny < 8:
                    target_piece = self.get_piece_at(nx, ny)
                    if not target_piece:
                        moves.append((nx, ny))
                    else:
                        if target_piece.side != piece.side:
                            moves.append((nx, ny))
                        break
                    nx += dx
                    ny += dy
                    
        elif piece.ptype == "K":
            king_moves = [(1,0), (-1,0), (0,1), (0,-1), (1,1), (1,-1), (-1,1), (-1,-1)]
            for dx, dy in king_moves:
                nx, ny = x + dx, y + dy
                if 0 <= nx < 8 and 0 <= ny < 8:
                    target_piece = self.get_piece_at(nx, ny)
                    if not target_piece or target_piece.side != piece.side:
                        moves.append((nx, ny))
            
            # Castling
            if not piece.moved and not self.is_in_check(piece.side):
                # Kingside castling
                if self.can_castle_kingside(piece.side):
                    moves.append((x + 2, y))
                # Queenside castling
                if self.can_castle_queenside(piece.side):
                    moves.append((x - 2, y))
                    
        return moves

    def can_castle_kingside(self, side):
        """Check if kingside castling is possible"""
        king_id = f"K{side}"
        rook_id = f"R2{side}"
        
        if (king_id not in self.pieces or rook_id not in self.pieces or 
            not self.pieces[king_id].alive or not self.pieces[rook_id].alive):
            return False
            
        king = self.pieces[king_id]
        rook = self.pieces[rook_id]
        
        if king.moved or rook.moved:
            return False
            
        # Check squares between king and rook are empty
        for x in range(king.x + 1, rook.x):
            if self.board[x][king.y]:
                return False
                
        # Check king doesn't pass through check
        enemy_side = BLACK if side == WHITE else WHITE
        for x in range(king.x, king.x + 3):
            if self.is_square_attacked(x, king.y, enemy_side):
                return False
                
        return True

    def can_castle_queenside(self, side):
        """Check if queenside castling is possible"""
        king_id = f"K{side}"
        rook_id = f"R1{side}"
        
        if (king_id not in self.pieces or rook_id not in self.pieces or 
            not self.pieces[king_id].alive or not self.pieces[rook_id].alive):
            return False
            
        king = self.pieces[king_id]
        rook = self.pieces[rook_id]
        
        if king.moved or rook.moved:
            return False
            
        # Check squares between king and rook are empty
        for x in range(rook.x + 1, king.x):
            if self.board[x][king.y]:
                return False
                
        # Check king doesn't pass through check
        enemy_side = BLACK if side == WHITE else WHITE
        for x in range(king.x - 2, king.x + 1):
            if self.is_square_attacked(x, king.y, enemy_side):
                return False
                
        return True

    def is_legal_move(self, piece, target):
        """Check if a move is legal (doesn't leave king in check)"""
        # Make a copy of the game state
        original_board = copy.deepcopy(self.board)
        original_pieces = {}
        for pid, p in self.pieces.items():
            original_pieces[pid] = p.copy()
        original_game_state = copy.deepcopy(self.game_state)
        
        # Try the move
        success = self.execute_move_internal(piece, target)
        if not success:
            # Restore state
            self.board = original_board
            self.pieces = original_pieces
            self.game_state = original_game_state
            return False
            
        # Check if our king is in check after the move
        is_legal = not self.is_in_check(piece.side)
        
        # Restore state
        self.board = original_board
        self.pieces = original_pieces
        self.game_state = original_game_state
        
        return is_legal

    def execute_move_internal(self, piece, target):
        """Execute move without checking legality"""
        tx, ty = target
        
        # Handle captures
        captured_piece = None
        if self.board[tx][ty]:
            captured_piece = self.pieces[self.board[tx][ty]]
            captured_piece.alive = False
            
        # Handle en passant capture
        if (piece.ptype == "P" and self.game_state.en_passant_target == target):
            # Remove the captured pawn
            ep_pawn_y = ty - (1 if piece.side == WHITE else -1)
            if self.board[tx][ep_pawn_y]:
                self.pieces[self.board[tx][ep_pawn_y]].alive = False
                self.board[tx][ep_pawn_y] = None
                
        # Handle castling
        if piece.ptype == "K" and abs(tx - piece.x) == 2:
            # Move the rook
            if tx > piece.x:  # Kingside
                rook_id = f"R2{piece.side}"
                rook = self.pieces[rook_id]
                self.board[rook.x][rook.y] = None
                rook.x = tx - 1
                self.board[rook.x][rook.y] = rook_id
                rook.moved = True
            else:  # Queenside
                rook_id = f"R1{piece.side}"
                rook = self.pieces[rook_id]
                self.board[rook.x][rook.y] = None
                rook.x = tx + 1
                self.board[rook.x][rook.y] = rook_id
                rook.moved = True
                
        # Move the piece
        self.board[piece.x][piece.y] = None
        piece.x, piece.y = tx, ty
        self.board[tx][ty] = piece.id
        piece.moved = True
        
        return True

    def show(self):
        print("\n    A   B   C   D   E   F   G   H")
        print("  +---+---+---+---+---+---+---+---+")
        for y in range(7, -1, -1):
            row = []
            for x in range(8):
                pid = self.board[x][y]
                if pid:
                    piece = self.pieces[pid]
                    if piece.alive:
                        color = "W" if piece.side == WHITE else "B"
                        display = f"{piece.ptype}{color}"
                        row.append(f"{display:2}")
                    else:
                        row.append(" .")
                else:
                    row.append(" .")
            print(f"{RANKS[y]} | " + " | ".join(row) + f" | {RANKS[y]}")
            print("  +---+---+---+---+---+---+---+---+")
        print("    A   B   C   D   E   F   G   H\n")
        
        turn_str = 'White' if self.to_move == WHITE else 'Black'
        print(f"Turn: {turn_str}")
        
        if self.is_in_check(self.to_move):
            print("CHECK!")
            
        if self.game_over:
            if self.winner:
                winner_str = 'White' if self.winner == WHITE else 'Black'
                print(f"CHECKMATE! {winner_str} wins!")
                if self.vs_ai:
                    if self.winner == self.ai_bot.side:
                        print(f"🤖 {self.ai_bot.name}: Good game! I enjoyed our match.")
                    else:
                        print(f"🤖 {self.ai_bot.name}: Well played! You got me this time.")
            else:
                print("STALEMATE! Draw!")
                if self.vs_ai:
                    print(f"🤖 {self.ai_bot.name}: A draw! That was a challenging game.")

    def discover(self, pid):
        if pid not in self.pieces or not self.pieces[pid].alive:
            print("Invalid piece.")
            return
        p = self.pieces[pid]
        moves = self.legal_moves(p)
        if not moves:
            print(f"{pid} has no legal moves.")
        else:
            move_strs = [self.square_to_str(x, y) for x, y in moves]
            print(f"{pid} can move to: " + ", ".join(move_strs))

    def move(self, pid, target_str):
        if self.game_over:
            print("Game is over!")
            return False
            
        if pid not in self.pieces or not self.pieces[pid].alive:
            print("Invalid piece.")
            return False
        p = self.pieces[pid]
        if p.side != self.to_move:
            print("Not your turn.")
            return False
        target = self.parse_square(target_str)
        if not target:
            print("Invalid square.")
            return False
        moves = self.legal_moves(p)
        if target not in moves:
            if moves:
                move_strs = [self.square_to_str(x, y) for x, y in moves]
                print(f"Illegal. {pid} can go: " + ", ".join(move_strs))
            else:
                print(f"{pid} has no legal moves.")
            return False
            
        # Execute the move
        tx, ty = target
        
        # Reset en passant
        self.game_state.en_passant_target = None
        
        # Handle pawn double move (set en passant target)
        if p.ptype == "P" and abs(ty - p.y) == 2:
            ep_y = p.y + (1 if p.side == WHITE else -1)
            self.game_state.en_passant_target = (p.x, ep_y)
            
        # Handle captures for 50-move rule
        is_capture = self.board[tx][ty] is not None
        if p.ptype == "P" or is_capture:
            self.game_state.halfmove_clock = 0
        else:
            self.game_state.halfmove_clock += 1
            
        # Execute move
        captured_piece = None
        if self.board[tx][ty]:
            captured_piece = self.pieces[self.board[tx][ty]]
            captured_piece.alive = False
            
        # Handle en passant capture
        if (p.ptype == "P" and target == self.game_state.en_passant_target):
            ep_pawn_y = ty - (1 if p.side == WHITE else -1)
            if self.board[tx][ep_pawn_y]:
                self.pieces[self.board[tx][ep_pawn_y]].alive = False
                self.board[tx][ep_pawn_y] = None
                
        # Handle castling
        if p.ptype == "K" and abs(tx - p.x) == 2:
            if tx > p.x:  # Kingside
                rook_id = f"R2{p.side}"
                rook = self.pieces[rook_id]
                self.board[rook.x][rook.y] = None
                rook.x = tx - 1
                self.board[rook.x][rook.y] = rook_id
                rook.moved = True
            else:  # Queenside
                rook_id = f"R1{p.side}"
                rook = self.pieces[rook_id]
                self.board[rook.x][rook.y] = None
                rook.x = tx + 1
                self.board[rook.x][rook.y] = rook_id
                rook.moved = True
                
        # Move the piece
        self.board[p.x][p.y] = None
        p.x, p.y = tx, ty
        self.board[tx][ty] = pid
        p.moved = True
        
        # Handle pawn promotion
        if p.ptype == "P" and (ty == 7 or ty == 0):
            if self.vs_ai and p.side == self.ai_bot.side:
                # AI always promotes to queen
                p.ptype = "Q"
                print(f"🤖 {self.ai_bot.name}: I'll promote my pawn to a Queen!")
            else:
                while True:
                    choice = input("Promote pawn to (Q/R/N/B): ").upper().strip()
                    if choice in "QRNB":
                        p.ptype = choice
                        break
                    print("Please enter Q, R, N, or B")
                
        # Switch turns
        self.to_move = BLACK if self.to_move == WHITE else WHITE
        if self.to_move == WHITE:
            self.game_state.fullmove_number += 1
            
        # Check for game end conditions
        self.check_game_over()
        
        # AI move if it's AI's turn
        if self.vs_ai and not self.game_over and self.to_move == self.ai_bot.side:
            self.show()
            self.ai_bot.think_and_move(self)
        else:
            self.show()
            
        return True

    def check_game_over(self):
        """Check if the game is over (checkmate, stalemate, draws)"""
        # Check if current player has any legal moves
        has_legal_moves = False
        for pid, piece in self.pieces.items():
            if piece.alive and piece.side == self.to_move:
                if self.legal_moves(piece):
                    has_legal_moves = True
                    break
                    
        if not has_legal_moves:
            if self.is_in_check(self.to_move):
                # Checkmate
                self.game_over = True
                self.winner = BLACK if self.to_move == WHITE else WHITE
            else:
                # Stalemate
                self.game_over = True
                self.winner = None
                
        # 50-move rule
        elif self.game_state.halfmove_clock >= 100:  # 50 moves = 100 half-moves
            self.game_over = True
            self.winner = None
            print("Draw by 50-move rule!")
            
        # Insufficient material (basic check)
        elif self.is_insufficient_material():
            self.game_over = True
            self.winner = None
            print("Draw by insufficient material!")

    def is_insufficient_material(self):
        """Check for insufficient material to mate"""
        alive_pieces = []
        for piece in self.pieces.values():
            if piece.alive and piece.ptype != "K":
                alive_pieces.append(piece.ptype)
                
        # King vs King
        if not alive_pieces:
            return True
            
        # King + Knight/Bishop vs King
        if len(alive_pieces) == 1 and alive_pieces[0] in ["N", "B"]:
            return True
            
        # King + Knight vs King + Knight
        if len(alive_pieces) == 2 and all(p == "N" for p in alive_pieces):
            return True
            
        return False

    def get_material_value(self, side):
        """Calculate material value for a side"""
        total = 0
        for piece in self.pieces.values():
            if piece.alive and piece.side == side:
                total += PIECE_VALUES[piece.ptype]
        return total

    def evaluate_position(self):
        """Simple position evaluation"""
        white_material = self.get_material_value(WHITE)
        black_material = self.get_material_value(BLACK)
        return white_material - black_material

# ========================
# CLI Interface
# ========================
HELP = """
🎯 CHESS COMMANDS:
/show                        -> Show the board
/discover <PIECE_ID>         -> Show moves for a piece (e.g. /discover P1_W)
/move <PIECE_ID> <SQUARE>    -> Move piece to target square (e.g. /move P1_W E4)
/status                      -> Show game status
/eval                        -> Show position evaluation
/hint                        -> Get a move suggestion (vs AI only)
/surrender                   -> Forfeit the game
/help                        -> Show this help
/quit                        -> Exit

🎮 GAME MODES:
/newgame                     -> Start human vs human game
/vs_ai                       -> Play against AI bot

⚔️ SPECIAL MOVES:
- Castling: /move K_W G1 (kingside) or /move K_W C1 (queenside)
- En passant: Automatic when legal
- Promotion: Choose piece when pawn reaches end rank

🔧 PIECE IDs:
- Pawns: P1_W through P8_W (White), P1_B through P8_B (Black)
- Others: R1_W, R2_W, N1_W, N2_W, B1_W, B2_W, Q_W, K_W (and _B for Black)
"""

def choose_game_mode():
    """Let user choose game mode and setup"""
    print("\n🎯 Welcome to Advanced Chess Engine! 🎯")
    print("\nChoose your game mode:")
    print("1. Human vs Human")
    print("2. Human vs AI Bot")
    
    while True:
        choice = input("\nEnter choice (1 or 2): ").strip()
        if choice == "1":
            return ChessGame(vs_ai=False)
        elif choice == "2":
            print("\n🤖 Setting up AI opponent...")
            
            # Choose side
            while True:
                side_choice = input("Do you want to play as White or Black? (W/B): ").upper().strip()
                if side_choice in ["W", "WHITE"]:
                    player_side = WHITE
                    break
                elif side_choice in ["B", "BLACK"]:
                    player_side = BLACK
                    break
                print("Please enter W for White or B for Black")
            
            # Choose difficulty
            print("\nChoose AI difficulty:")
            print("1. Easy (depth 2)")
            print("2. Medium (depth 3)")  
            print("3. Hard (depth 4)")
            print("4. Expert (depth 5)")
            
            while True:
                diff_choice = input("Enter difficulty (1-4): ").strip()
                if diff_choice == "1":
                    difficulty = 2
                    break
                elif diff_choice == "2":
                    difficulty = 3
                    break
                elif diff_choice == "3":
                    difficulty = 4
                    break
                elif diff_choice == "4":
                    difficulty = 5
                    break
                print("Please enter a number 1-4")
            
            return ChessGame(vs_ai=True, player_side=player_side, ai_difficulty=difficulty)
        else:
            print("Please enter 1 or 2")

def main():
    game = choose_game_mode()
    print("\nType /help for commands. Let's play chess! 🎯")
    
    # If AI plays first (as White)
    if game.vs_ai and game.to_move == game.ai_bot.side:
        game.show()
        game.ai_bot.think_and_move(game)
    else:
        game.show()
    
    while True:
        if game.game_over:
            play_again = input("\nPlay again? (y/n): ").lower().strip()
            if play_again.startswith('y'):
                game = choose_game_mode()
                if game.vs_ai and game.to_move == game.ai_bot.side:
                    game.show()
                    game.ai_bot.think_and_move(game)
                else:
                    game.show()
                continue
            else:
                print("Thanks for playing! 👋")
                break
                
        cmd = input("> ").strip()
        if not cmd:
            continue
            
        if cmd.startswith("/show"):
            game.show()
            
        elif cmd.startswith("/help"):
            print(HELP)
            
        elif cmd.startswith("/newgame"):
            game = ChessGame(vs_ai=False)
            print("Started new human vs human game!")
            game.show()
            
        elif cmd.startswith("/vs_ai"):
            game = choose_game_mode()
            if game.vs_ai and game.to_move == game.ai_bot.side:
                game.show()
                game.ai_bot.think_and_move(game)
            else:
                game.show()
                
        elif cmd.startswith("/status"):
            turn_str = 'White' if game.to_move == WHITE else 'Black'
            print(f"Turn: {turn_str}")
            print(f"Move: {game.game_state.fullmove_number}")
            print(f"Half-moves since pawn/capture: {game.game_state.halfmove_clock}")
            if game.is_in_check(game.to_move):
                print("Current player is in CHECK!")
            if game.vs_ai:
                ai_side_str = 'White' if game.ai_bot.side == WHITE else 'Black'
                print(f"AI is playing as: {ai_side_str} (difficulty {game.ai_bot.difficulty})")
                
        elif cmd.startswith("/eval"):
            eval_score = game.evaluate_position()
            print(f"Position evaluation: {eval_score:+.0f}")
            print(f"White material: {game.get_material_value(WHITE)}")
            print(f"Black material: {game.get_material_value(BLACK)}")
            
        elif cmd.startswith("/hint") and game.vs_ai:
            if game.to_move != game.ai_bot.side:
                print("🤖 ChessBot AI: Let me suggest a move for you...")
                # Create temporary bot for player's side
                temp_bot = ChessBot(game.to_move, 2)  # Lower depth for hints
                best_move = temp_bot.get_best_move(game)
                if best_move:
                    piece_id, target = best_move
                    target_str = game.square_to_str(*target)
                    print(f"🤖 ChessBot AI: I suggest moving {piece_id} to {target_str}")
                else:
                    print("🤖 ChessBot AI: I couldn't find a good move suggestion.")
            else:
                print("🤖 ChessBot AI: It's my turn to move, no hints needed!")
                
        elif cmd.startswith("/surrender"):
            if game.vs_ai:
                game.winner = game.ai_bot.side
                print(f"You surrendered. 🤖 {game.ai_bot.name}: Thanks for the game!")
            else:
                current_player = 'White' if game.to_move == WHITE else 'Black'
                print(f"{current_player} surrendered!")
                game.winner = BLACK if game.to_move == WHITE else WHITE
            game.game_over = True
            game.show()
            
        elif cmd.startswith("/discover"):
            parts = cmd.split()
            if len(parts) != 2:
                print("Usage: /discover P1_W")
                continue
            game.discover(parts[1])
            
        elif cmd.startswith("/move"):
            parts = cmd.split()
            if len(parts) != 3:
                print("Usage: /move P1_W E4")
                continue
            
            # Check if it's human's turn when vs AI
            if game.vs_ai and game.to_move == game.ai_bot.side:
                print(f"🤖 {game.ai_bot.name}: Wait, it's my turn!")
                continue
                
            game.move(parts[1], parts[2])
            
        elif cmd.startswith("/quit"):
            print("Thanks for playing! 👋")
            break
            
        else:
            print("Unknown command. Use /help for available commands.")

if __name__ == "__main__":
    main()